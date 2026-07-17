import { BadRequestException, ConflictException } from '@nestjs/common';
import { Appointment } from '@domain/models/appointment.model';
import { AppointmentStatus } from '@domain/enums/appointment-status.enum';
import {
  CalendarSyncOperation,
  CalendarSyncStatus,
} from '@domain/enums/calendar-sync-status.enum';
import type { IAppointmentRepository } from '@domain/ports/appointment.repository.interface';
import { AppointmentService } from './appointment.service';

describe('AppointmentService status rules', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-17T17:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const createService = (appointment: Appointment) => {
    const appointmentRepository = {
      findById: jest.fn().mockResolvedValue(appointment),
      create: jest
        .fn()
        .mockImplementation(
          async (data) => new Appointment({ id: 'created-1', ...data }),
        ),
      update: jest
        .fn()
        .mockImplementation(
          async (_id, data) => new Appointment({ ...appointment, ...data }),
        ),
    } as unknown as jest.Mocked<IAppointmentRepository>;

    const userRepository = {
      findById: jest.fn().mockResolvedValue({
        id: appointment.userId || 'user-1',
        companyId: appointment.companyId || 'company-1',
        integrationProvider: 'none',
        syncCalendar: false,
      }),
    };
    const clientRepository = {
      findById: jest.fn().mockResolvedValue({
        id: appointment.clientId || 'client-1',
        companyId: appointment.companyId || 'company-1',
      }),
    };
    const googleCalendarSync = { trigger: jest.fn() };
    const appointmentAvailability = {
      assertAvailable: jest.fn().mockResolvedValue(undefined),
    };
    const scheduleConflicts = {
      resolveAppointment: jest.fn().mockResolvedValue(undefined),
    };

    const service = new AppointmentService(
      appointmentRepository,
      clientRepository as never,
      userRepository as never,
      googleCalendarSync as never,
      appointmentAvailability as never,
      scheduleConflicts as never,
    );
    return {
      service,
      appointmentRepository,
      userRepository,
      googleCalendarSync,
      appointmentAvailability,
      scheduleConflicts,
      clientRepository,
    };
  };

  it('rejects creating an appointment in the past', async () => {
    const { service, appointmentRepository } = createService(
      new Appointment({ companyId: 'company-1' }),
    );

    await expect(
      service.createAppointment({
        clientId: 'client-1',
        userId: 'user-1',
        companyId: 'company-1',
        title: 'Cita pasada',
        startTime: new Date('2026-07-17T16:00:00.000Z'),
        endTime: new Date('2026-07-17T17:30:00.000Z'),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(appointmentRepository.create).not.toHaveBeenCalled();
  });

  it('checks availability before creating a scheduled appointment', async () => {
    const { service, appointmentAvailability } = createService(
      new Appointment({ companyId: 'company-1' }),
    );

    const startTime = new Date('2026-07-18T16:00:00.000Z');
    const endTime = new Date('2026-07-18T17:00:00.000Z');
    await service.createAppointment({
      clientId: 'client-1',
      userId: 'user-1',
      companyId: 'company-1',
      title: 'Consulta',
      startTime,
      endTime,
    });

    expect(appointmentAvailability.assertAvailable).toHaveBeenCalledWith({
      userId: 'user-1',
      companyId: 'company-1',
      startTime,
      endTime,
    });
  });

  it('rejects updating an appointment to a past time', async () => {
    const { service, appointmentRepository } = createService(
      new Appointment({
        id: 'appointment-1',
        companyId: 'company-1',
        status: AppointmentStatus.SCHEDULED,
        startTime: new Date('2026-07-18T15:00:00.000Z'),
        endTime: new Date('2026-07-18T16:00:00.000Z'),
      }),
    );

    await expect(
      service.updateAppointment(
        'appointment-1',
        {
          startTime: new Date('2026-07-17T16:00:00.000Z'),
          endTime: new Date('2026-07-17T17:30:00.000Z'),
        },
        'company-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(appointmentRepository.update).not.toHaveBeenCalled();
  });

  it('rejects an end time that is not after the start time', async () => {
    const { service, appointmentRepository } = createService(
      new Appointment({ companyId: 'company-1' }),
    );

    await expect(
      service.createAppointment({
        clientId: 'client-1',
        userId: 'user-1',
        companyId: 'company-1',
        title: 'Horario inválido',
        startTime: new Date('2026-07-18T16:00:00.000Z'),
        endTime: new Date('2026-07-18T15:00:00.000Z'),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(appointmentRepository.create).not.toHaveBeenCalled();
  });

  it('prevents non-description changes to completed appointments', async () => {
    const { service, appointmentRepository } = createService(
      new Appointment({
        id: 'appointment-1',
        companyId: 'company-1',
        status: AppointmentStatus.COMPLETED,
      }),
    );

    await expect(
      service.updateAppointment(
        'appointment-1',
        { title: 'Cambio no permitido' },
        'company-1',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(appointmentRepository.update).not.toHaveBeenCalled();
  });

  it('allows updating the description of completed appointments', async () => {
    const { service, appointmentRepository } = createService(
      new Appointment({
        id: 'appointment-1',
        companyId: 'company-1',
        status: AppointmentStatus.COMPLETED,
        description: 'Descripción inicial',
      }),
    );

    await service.updateAppointment(
      'appointment-1',
      { description: 'Descripción corregida' },
      'company-1',
    );

    expect(appointmentRepository.update).toHaveBeenCalledWith(
      'appointment-1',
      expect.objectContaining({
        description: 'Descripción corregida',
        companyId: 'company-1',
        calendarSyncStatus: CalendarSyncStatus.NOT_SYNCED,
      }),
    );
  });

  it('reschedules a cancelled appointment when it is edited', async () => {
    const { service, appointmentRepository } = createService(
      new Appointment({
        id: 'appointment-1',
        companyId: 'company-1',
        status: AppointmentStatus.CANCELLED,
        startTime: new Date('2026-07-20T15:00:00.000Z'),
        endTime: new Date('2026-07-20T16:00:00.000Z'),
      }),
    );

    await service.updateAppointment(
      'appointment-1',
      { title: 'Nueva fecha' },
      'company-1',
    );

    expect(appointmentRepository.update).toHaveBeenCalledWith(
      'appointment-1',
      expect.objectContaining({
        title: 'Nueva fecha',
        status: AppointmentStatus.SCHEDULED,
        companyId: 'company-1',
      }),
    );
  });

  it('reschedules an expired appointment when it is edited', async () => {
    const { service, appointmentRepository } = createService(
      new Appointment({
        id: 'appointment-1',
        companyId: 'company-1',
        status: AppointmentStatus.EXPIRED,
        startTime: new Date('2026-07-16T15:00:00.000Z'),
        endTime: new Date('2026-07-16T16:00:00.000Z'),
      }),
    );

    await service.updateAppointment(
      'appointment-1',
      {
        startTime: new Date('2026-07-20T15:00:00.000Z'),
        endTime: new Date('2026-07-20T16:00:00.000Z'),
      },
      'company-1',
    );

    expect(appointmentRepository.update).toHaveBeenCalledWith(
      'appointment-1',
      expect.objectContaining({
        status: AppointmentStatus.SCHEDULED,
        companyId: 'company-1',
      }),
    );
  });

  it('schedules a Google upsert when a linked appointment is edited', async () => {
    const {
      service,
      appointmentRepository,
      userRepository,
      googleCalendarSync,
    } = createService(
      new Appointment({
        id: 'appointment-1',
        userId: 'user-1',
        companyId: 'company-1',
        status: AppointmentStatus.SCHEDULED,
      }),
    );
    userRepository.findById.mockResolvedValue({
      id: 'user-1',
      googleId: 'google-1',
      integrationProvider: 'google',
      syncCalendar: true,
    });

    await service.updateAppointment(
      'appointment-1',
      { title: 'Consulta actualizada' },
      'company-1',
    );

    expect(appointmentRepository.update).toHaveBeenCalledWith(
      'appointment-1',
      expect.objectContaining({
        calendarSyncStatus: CalendarSyncStatus.PENDING,
        calendarSyncOperation: CalendarSyncOperation.UPSERT,
      }),
    );
    expect(googleCalendarSync.trigger).toHaveBeenCalledWith('appointment-1');
  });

  it('excludes the current appointment when checking a reschedule', async () => {
    const { service, appointmentAvailability } = createService(
      new Appointment({
        id: 'appointment-1',
        userId: 'user-1',
        companyId: 'company-1',
        status: AppointmentStatus.SCHEDULED,
        startTime: new Date('2026-07-18T15:00:00.000Z'),
        endTime: new Date('2026-07-18T16:00:00.000Z'),
      }),
    );
    const startTime = new Date('2026-07-19T15:00:00.000Z');
    const endTime = new Date('2026-07-19T16:00:00.000Z');

    await service.updateAppointment(
      'appointment-1',
      { startTime, endTime },
      'company-1',
    );

    expect(appointmentAvailability.assertAvailable).toHaveBeenCalledWith({
      userId: 'user-1',
      companyId: 'company-1',
      startTime,
      endTime,
      excludeAppointmentId: 'appointment-1',
    });
  });
});
