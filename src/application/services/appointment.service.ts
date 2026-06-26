import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { APPOINTMENT_REPOSITORY } from '@domain/ports/appointment.repository.interface';
import type { IAppointmentRepository } from '@domain/ports/appointment.repository.interface';
import { CLIENT_REPOSITORY } from '@domain/ports/client.repository.interface';
import type { IClientRepository } from '@domain/ports/client.repository.interface';
import { USER_REPOSITORY } from '@domain/ports/user.repository.interface';
import type { IUserRepository } from '@domain/ports/user.repository.interface';
import { PAYMENT_PROVIDER } from '@domain/ports/payment.provider.interface';
import type { IPaymentProvider } from '@domain/ports/payment.provider.interface';
import { MESSAGING_PROVIDER } from '@domain/ports/messaging.provider.interface';
import type { IMessagingProvider } from '@domain/ports/messaging.provider.interface';
import { MESSAGE_TEMPLATE_REPOSITORY } from '@domain/ports/message-template.repository.interface';
import type { IMessageTemplateRepository } from '@domain/ports/message-template.repository.interface';
import { TemplateRendererService } from './template-renderer.service';
import { Appointment } from '@domain/models/appointment.model';
import { AppointmentStatus } from '@domain/enums/appointment-status.enum';
import { Client } from '@domain/models/client.model';
import { ClientStage } from '@domain/enums/client-stage.enum';

@Injectable()
export class AppointmentService {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: IAppointmentRepository,
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: IClientRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(PAYMENT_PROVIDER)
    private readonly paymentProvider: IPaymentProvider,
    @Inject(MESSAGING_PROVIDER)
    private readonly messagingProvider: IMessagingProvider,
    @Inject(MESSAGE_TEMPLATE_REPOSITORY)
    private readonly templateRepository: IMessageTemplateRepository,
    private readonly templateRenderer: TemplateRendererService,
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

  async createAppointment(
    data: Partial<Appointment>,
    requestPaymentLink?: boolean,
  ): Promise<Appointment> {
    if (!data.clientId) throw new Error('clientId is required');
    if (!data.userId) throw new Error('userId is required');
    if (!data.companyId) throw new Error('companyId is required');
    const client = await this.getClientAssertExists(
      data.clientId,
      data.companyId,
    );
    const user = await this.userRepository.findById(data.userId);
    if (!user || user.companyId !== data.companyId) {
      throw new NotFoundException(`User ${data.userId} not found`);
    }

    const appointment = await this.appointmentRepository.create(data);

    if (requestPaymentLink && user?.paymentEnabled) {
      // Si el usuario configuró su key de pago, ideal usarla.
      // Aquí estamos llamando a un mock pero la idea es:
      // this.paymentProvider.createPaymentIntent(..., user.paymentGatewayKey)
      const paymentResult = await this.paymentProvider.createPaymentIntent(
        50, // Valores dummies temporalmente mientras armamos el dominio de Pricing
        'PEN',
        `Cita con cliente ${appointment.clientId}`,
        appointment.id,
      );

      const updatedAppointment = await this.appointmentRepository.update(
        appointment.id,
        {
          status: AppointmentStatus.PENDING_PAYMENT,
          paymentId: paymentResult.id,
          paymentUrl: paymentResult.checkoutUrl,
        },
      );

      // Enviar WhatsApp al cliente utilizando plantillas dinámicas si existen
      let message = `Hola ${client.firstName}. Tienes una cita programada para el día ${appointment.startTime.toLocaleDateString('es-ES')}. Por favor, confirma tu asistencia realizando el pago en el siguiente enlace: ${paymentResult.checkoutUrl}`;

      try {
        if (!user) throw new Error('Usuario emisor no encontrado');

        // Buscar plantilla para FOLLOW_UP o FIRST_CONTACT
        const userTemplates = await this.templateRepository.findByCompanyId(
          appointment.companyId || user.companyId || '',
        );
        const template =
          userTemplates.find((t) => t.stage === ClientStage.FIRST_CONTACT) ||
          userTemplates.find((t) => t.stage === ClientStage.FOLLOW_UP);

        if (template) {
          message = this.templateRenderer.render(template.messageBody, {
            name: client.firstName,
            paymentUrl: paymentResult.checkoutUrl,
            date: appointment.startTime.toLocaleDateString('es-ES'),
          });
        }

        await this.messagingProvider.sendMessage(
          user.id,
          client.phoneNumber,
          message,
        );
      } catch (error) {
        console.error('Error enviando WhatsApp:', error);
      }

      return updatedAppointment;
    }

    return appointment;
  }

  async getAppointmentById(
    id: string,
    companyId: string,
  ): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findById(id);
    if (!appointment || appointment.companyId !== companyId)
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
    await this.getAppointmentById(id, companyId); // asserts ownership
    return this.appointmentRepository.update(id, { ...data, companyId });
  }

  async deleteAppointment(id: string, companyId: string): Promise<void> {
    await this.getAppointmentById(id, companyId); // asserts ownership
    await this.appointmentRepository.delete(id);
  }
}
