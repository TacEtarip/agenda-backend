import { AppointmentStatus } from '@domain/enums/appointment-status.enum';
import { Appointment } from '@domain/models/appointment.model';
import { Client } from '@domain/models/client.model';
import type { IAppointmentRepository } from '@domain/ports/appointment.repository.interface';
import { APPOINTMENT_REPOSITORY } from '@domain/ports/appointment.repository.interface';
import type { IClientRepository } from '@domain/ports/client.repository.interface';
import { CLIENT_REPOSITORY } from '@domain/ports/client.repository.interface';
import type { IUserRepository } from '@domain/ports/user.repository.interface';
import { USER_REPOSITORY } from '@domain/ports/user.repository.interface';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class AppointmentService {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: IAppointmentRepository,
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: IClientRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
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
    await this.getClientAssertExists(data.clientId, data.companyId);
    const user = await this.userRepository.findById(data.userId);
    if (!user?.companyId || user.companyId !== data.companyId) {
      throw new NotFoundException(`User ${data.userId} not found`);
    }

    return this.appointmentRepository.create(data);
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

      return this.appointmentRepository.update(id, {
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

    if (
      appointment.status === AppointmentStatus.CANCELLED &&
      data.status !== undefined &&
      data.status !== AppointmentStatus.SCHEDULED
    ) {
      throw new ConflictException(
        'Cancelled appointments must be rescheduled before changing status',
      );
    }

    const normalizedData =
      appointment.status === AppointmentStatus.CANCELLED && hasAppointmentEdits
        ? { ...data, status: AppointmentStatus.SCHEDULED }
        : data;

    return this.appointmentRepository.update(id, {
      ...normalizedData,
      companyId,
    });
  }

  async deleteAppointment(id: string, companyId: string): Promise<void> {
    await this.getAppointmentById(id, companyId); // asserts ownership
    await this.appointmentRepository.delete(id);
  }
}
