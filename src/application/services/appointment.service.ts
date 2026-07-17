import { AppointmentStatus } from '@domain/enums/appointment-status.enum';
import {
  CalendarSyncOperation,
  CalendarSyncStatus,
} from '@domain/enums/calendar-sync-status.enum';
import { Appointment } from '@domain/models/appointment.model';
import { User } from '@domain/models/user.model';
import { Client } from '@domain/models/client.model';
import type { IAppointmentRepository } from '@domain/ports/appointment.repository.interface';
import { APPOINTMENT_REPOSITORY } from '@domain/ports/appointment.repository.interface';
import type { IClientRepository } from '@domain/ports/client.repository.interface';
import { CLIENT_REPOSITORY } from '@domain/ports/client.repository.interface';
import type { IUserRepository } from '@domain/ports/user.repository.interface';
import { USER_REPOSITORY } from '@domain/ports/user.repository.interface';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GoogleCalendarSyncService } from './google-calendar-sync.service';
import { AppointmentAvailabilityService } from './appointment-availability.service';
import { AppointmentScheduleConflictService } from './appointment-schedule-conflict.service';

@Injectable()
export class AppointmentService {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: IAppointmentRepository,
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: IClientRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly googleCalendarSync: GoogleCalendarSyncService,
    private readonly appointmentAvailability: AppointmentAvailabilityService,
    private readonly scheduleConflicts: AppointmentScheduleConflictService,
  ) {}

  private async getClientAssertExists(
    clientId: string,
    companyId?: string,
  ): Promise<Client> {
    const client = await this.clientRepository.findById(clientId);
    if (!client || (companyId && client.companyId !== companyId)) {
      throw new NotFoundException(`Client ${clientId} not found`);
    }
    return client;
  }

  async createAppointment(data: Partial<Appointment>): Promise<Appointment> {
    if (!data.clientId) throw new Error('clientId is required');
    if (!data.userId) throw new Error('userId is required');
    if (!data.companyId) throw new Error('companyId is required');
    this.assertValidSchedule(data.startTime, data.endTime);
    await this.getClientAssertExists(data.clientId, data.companyId);
    const user = await this.userRepository.findById(data.userId);
    if (!user?.companyId || user.companyId !== data.companyId) {
      throw new NotFoundException(`User ${data.userId} not found`);
    }

    if (
      (data.status ?? AppointmentStatus.SCHEDULED) ===
      AppointmentStatus.SCHEDULED
    ) {
      await this.appointmentAvailability.assertAvailable({
        userId: data.userId,
        companyId: data.companyId,
        startTime: data.startTime!,
        endTime: data.endTime!,
      });
    }

    let created: Appointment;
    try {
      created = await this.appointmentRepository.create({
        ...data,
        ...this.calendarSyncFields(user, data.status),
      });
    } catch (error) {
      this.rethrowScheduleConflict(error);
      throw error;
    }
    if (created.calendarSyncStatus === CalendarSyncStatus.PENDING) {
      this.googleCalendarSync.trigger(created.id);
    }
    return created;
  }

  async getAppointmentById(
    id: string,
    companyId: string,
  ): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findById(id);
    if (!appointment?.companyId || appointment.companyId !== companyId)
      throw new NotFoundException(`Appointment ${id} not found`);
    return appointment;
  }

  async getAppointmentsByCompany(companyId: string): Promise<Appointment[]> {
    return await this.appointmentRepository.findAllByCompanyId(companyId);
  }

  async getAppointmentsByClient(
    clientId: string,
    companyId: string,
  ): Promise<Appointment[]> {
    await this.getClientAssertExists(clientId, companyId);
    return await this.appointmentRepository.findAllByClientId(clientId);
  }

  async updateAppointment(
    id: string,
    data: Partial<Appointment>,
    companyId: string,
  ): Promise<Appointment> {
    const appointment = await this.getAppointmentById(id, companyId);
    const user = await this.userRepository.findById(appointment.userId);
    if (appointment.status === AppointmentStatus.COMPLETED) {
      const hasNonDescriptionChanges = [
        data.title,
        data.startTime,
        data.endTime,
        data.status,
        data.externalEventId,
        data.meetingUrl,
      ].some((value) => value !== undefined);

      if (hasNonDescriptionChanges) {
        throw new ConflictException(
          'Completed appointments only allow description updates',
        );
      }

      return this.updateWithCalendarSync(appointment, user, {
        description: data.description,
        companyId,
      });
    }

    const hasAppointmentEdits = [
      data.title,
      data.description,
      data.startTime,
      data.endTime,
      data.externalEventId,
      data.meetingUrl,
    ].some((value) => value !== undefined);

    const isInactiveAppointment = [
      AppointmentStatus.CANCELLED,
      AppointmentStatus.EXPIRED,
    ].includes(appointment.status);

    if (
      isInactiveAppointment &&
      data.status !== undefined &&
      data.status !== AppointmentStatus.SCHEDULED
    ) {
      throw new ConflictException(
        'Cancelled or expired appointments must be rescheduled before changing status',
      );
    }

    const normalizedData =
      isInactiveAppointment && hasAppointmentEdits
        ? { ...data, status: AppointmentStatus.SCHEDULED }
        : data;

    const reschedulesInactiveAppointment =
      isInactiveAppointment &&
      (hasAppointmentEdits || data.status === AppointmentStatus.SCHEDULED);
    if (
      data.startTime !== undefined ||
      data.endTime !== undefined ||
      reschedulesInactiveAppointment
    ) {
      this.assertValidSchedule(
        data.startTime ?? appointment.startTime,
        data.endTime ?? appointment.endTime,
      );
    }

    const nextStatus = normalizedData.status ?? appointment.status;
    if (
      nextStatus === AppointmentStatus.SCHEDULED &&
      (data.startTime !== undefined ||
        data.endTime !== undefined ||
        reschedulesInactiveAppointment)
    ) {
      await this.appointmentAvailability.assertAvailable({
        userId: appointment.userId,
        companyId,
        startTime: normalizedData.startTime ?? appointment.startTime,
        endTime: normalizedData.endTime ?? appointment.endTime,
        excludeAppointmentId: appointment.id,
      });
    }

    const updated = await this.updateWithCalendarSync(appointment, user, {
      ...normalizedData,
      companyId,
    });
    if (
      normalizedData.startTime !== undefined ||
      normalizedData.endTime !== undefined ||
      (normalizedData.status !== undefined &&
        normalizedData.status !== appointment.status)
    ) {
      await this.scheduleConflicts.resolveAppointment(appointment.id);
    }
    return updated;
  }

  async deleteAppointment(id: string, companyId: string): Promise<void> {
    const appointment = await this.getAppointmentById(id, companyId);
    const user = await this.userRepository.findById(appointment.userId);
    if (this.shouldSyncCalendar(user)) {
      await this.appointmentRepository.update(id, {
        calendarSyncStatus: CalendarSyncStatus.PENDING,
        calendarSyncOperation: CalendarSyncOperation.DELETE,
        calendarSyncError: null,
        calendarSyncAttempts: 0,
        calendarSyncNextAttemptAt: null,
      });
      await this.appointmentRepository.softDelete(id);
      await this.scheduleConflicts.resolveAppointment(id);
      this.googleCalendarSync.trigger(id);
      return;
    }
    await this.appointmentRepository.hardDelete(id);
  }

  async retryCalendarSync(id: string, companyId: string): Promise<Appointment> {
    const appointment = await this.getAppointmentById(id, companyId);
    const user = await this.userRepository.findById(appointment.userId);
    if (!this.shouldSyncCalendar(user)) {
      throw new ConflictException(
        'Google Calendar must be linked and enabled before retrying',
      );
    }
    const updated = await this.appointmentRepository.update(id, {
      ...this.calendarSyncFields(user, appointment.status),
    });
    this.googleCalendarSync.trigger(id);
    return updated;
  }

  private async updateWithCalendarSync(
    appointment: Appointment,
    user: User | null,
    data: Partial<Appointment>,
  ): Promise<Appointment> {
    let updated: Appointment;
    try {
      updated = await this.appointmentRepository.update(appointment.id, {
        ...data,
        ...this.calendarSyncFields(user, data.status ?? appointment.status),
      });
    } catch (error) {
      this.rethrowScheduleConflict(error);
      throw error;
    }
    if (updated.calendarSyncStatus === CalendarSyncStatus.PENDING) {
      this.googleCalendarSync.trigger(updated.id);
    }
    return updated;
  }

  private calendarSyncFields(
    user: User | null,
    status = AppointmentStatus.SCHEDULED,
  ): Partial<Appointment> {
    if (!this.shouldSyncCalendar(user)) {
      return {
        calendarSyncStatus: CalendarSyncStatus.NOT_SYNCED,
        calendarSyncOperation: null,
        calendarSyncError: null,
        calendarSyncAttempts: 0,
        calendarSyncNextAttemptAt: null,
      };
    }
    return {
      calendarSyncStatus: CalendarSyncStatus.PENDING,
      calendarSyncOperation:
        status === AppointmentStatus.CANCELLED
          ? CalendarSyncOperation.DELETE
          : CalendarSyncOperation.UPSERT,
      calendarSyncError: null,
      calendarSyncAttempts: 0,
      calendarSyncNextAttemptAt: null,
    };
  }

  private shouldSyncCalendar(user: User | null): boolean {
    return Boolean(
      user?.googleId &&
      user.integrationProvider === 'google' &&
      user.syncCalendar !== false,
    );
  }

  private assertValidSchedule(startTime?: Date, endTime?: Date): void {
    const startTimestamp = startTime?.getTime();
    const endTimestamp = endTime?.getTime();

    if (
      startTimestamp === undefined ||
      endTimestamp === undefined ||
      Number.isNaN(startTimestamp) ||
      Number.isNaN(endTimestamp)
    ) {
      throw new BadRequestException(
        'A valid appointment start and end time are required',
      );
    }

    if (startTimestamp < Date.now()) {
      throw new BadRequestException(
        'Appointment start time cannot be in the past',
      );
    }

    if (endTimestamp <= startTimestamp) {
      throw new BadRequestException(
        'Appointment end time must be after its start time',
      );
    }
  }

  private rethrowScheduleConflict(error: unknown): void {
    if (!error || typeof error !== 'object') return;
    const candidate = error as {
      code?: string;
      driverError?: { code?: string };
    };
    if (candidate.code === '23P01' || candidate.driverError?.code === '23P01') {
      throw new ConflictException({
        code: 'APPOINTMENT_TIME_CONFLICT',
        message: 'The selected appointment time is already occupied',
        available: false,
        externalCalendarChecked: false,
        conflicts: [],
      });
    }
  }
}
