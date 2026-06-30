import { ConflictException } from '@nestjs/common';
import { Appointment } from '@domain/models/appointment.model';
import { AppointmentStatus } from '@domain/enums/appointment-status.enum';
import type { IAppointmentRepository } from '@domain/ports/appointment.repository.interface';
import { TemplateRendererService } from './template-renderer.service';
import { AppointmentService } from './appointment.service';

describe('AppointmentService status rules', () => {
  const createService = (appointment: Appointment) => {
    const appointmentRepository = {
      findById: jest.fn().mockResolvedValue(appointment),
      update: jest.fn().mockImplementation(async (_id, data) =>
        new Appointment({ ...appointment, ...data }),
      ),
    } as unknown as jest.Mocked<IAppointmentRepository>;

    const service = new AppointmentService(
      appointmentRepository,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      new TemplateRendererService(),
    );
    return { service, appointmentRepository };
  };

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

    expect(appointmentRepository.update).toHaveBeenCalledWith('appointment-1', {
      description: 'Descripción corregida',
      companyId: 'company-1',
    });
  });

  it('reschedules a cancelled appointment when it is edited', async () => {
    const { service, appointmentRepository } = createService(
      new Appointment({
        id: 'appointment-1',
        companyId: 'company-1',
        status: AppointmentStatus.CANCELLED,
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
});
