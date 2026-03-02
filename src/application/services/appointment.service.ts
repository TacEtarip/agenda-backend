import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { APPOINTMENT_REPOSITORY } from '@domain/ports/appointment.repository.interface';
import type { IAppointmentRepository } from '@domain/ports/appointment.repository.interface';
import { CLIENT_REPOSITORY } from '@domain/ports/client.repository.interface';
import type { IClientRepository } from '@domain/ports/client.repository.interface';
import { Appointment } from '@domain/models/appointment.model';

@Injectable()
export class AppointmentService {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: IAppointmentRepository,
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: IClientRepository,
  ) {}

  private async assertClientExists(clientId: string): Promise<void> {
    const client = await this.clientRepository.findById(clientId);
    if (!client) throw new NotFoundException(`Client ${clientId} not found`);
  }

  async createAppointment(data: Partial<Appointment>): Promise<Appointment> {
    if (!data.clientId) throw new Error('clientId is required');
    if (!data.userId) throw new Error('userId is required');
    await this.assertClientExists(data.clientId);
    return this.appointmentRepository.create(data);
  }

  async getAppointmentById(id: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findById(id);
    if (!appointment)
      throw new NotFoundException(`Appointment ${id} not found`);
    return appointment;
  }

  async getAppointmentsByUser(userId: string): Promise<Appointment[]> {
    return this.appointmentRepository.findAllByUserId(userId);
  }

  async getAppointmentsByClient(clientId: string): Promise<Appointment[]> {
    await this.assertClientExists(clientId);
    return this.appointmentRepository.findAllByClientId(clientId);
  }

  async updateAppointment(
    id: string,
    data: Partial<Appointment>,
  ): Promise<Appointment> {
    await this.getAppointmentById(id); // asserts existence
    return this.appointmentRepository.update(id, data);
  }

  async deleteAppointment(id: string): Promise<void> {
    await this.getAppointmentById(id); // asserts existence
    await this.appointmentRepository.delete(id);
  }
}
