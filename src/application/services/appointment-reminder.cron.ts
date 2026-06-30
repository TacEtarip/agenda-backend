import { AppointmentStatus } from '@domain/enums/appointment-status.enum';
import { ClientStage } from '@domain/enums/client-stage.enum';
import type { Appointment } from '@domain/models/appointment.model';
import type { IAppointmentRepository } from '@domain/ports/appointment.repository.interface';
import { APPOINTMENT_REPOSITORY } from '@domain/ports/appointment.repository.interface';
import type { IClientRepository } from '@domain/ports/client.repository.interface';
import { CLIENT_REPOSITORY } from '@domain/ports/client.repository.interface';
import type { IMessageTemplateRepository } from '@domain/ports/message-template.repository.interface';
import { MESSAGE_TEMPLATE_REPOSITORY } from '@domain/ports/message-template.repository.interface';
import type { IMessagingProvider } from '@domain/ports/messaging.provider.interface';
import { MESSAGING_PROVIDER } from '@domain/ports/messaging.provider.interface';
import { PaymentSourceType } from '@domain/enums/payment-source-type.enum';
import type { IPaymentRepository } from '@domain/ports/payment.repository.interface';
import { PAYMENT_REPOSITORY } from '@domain/ports/payment.repository.interface';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TemplateRendererService } from './template-renderer.service';

@Injectable()
export class AppointmentReminderCron {
  private readonly logger = new Logger(AppointmentReminderCron.name);

  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: IAppointmentRepository,
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: IClientRepository,
    @Inject(MESSAGING_PROVIDER)
    private readonly messagingProvider: IMessagingProvider,
    @Inject(MESSAGE_TEMPLATE_REPOSITORY)
    private readonly templateRepository: IMessageTemplateRepository,
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
    private readonly templateRenderer: TemplateRendererService,
  ) {}

  // Se ejecuta cada hora (o puedes cambiarlo a CronExpression.EVERY_DAY_AT_8AM, etc.)
  @Cron(CronExpression.EVERY_HOUR)
  async handleReminders() {
    this.logger.debug('Running appointment reminders check...');
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    // As in a real system we'd check if a reminder was already sent, for MVP we can do a narrowed window
    // to avoid sending it multiple times. Right now, it's finding appointments between now and +24h.
    // Let's refine it to appointments strictly between 23 and 24 hours from now.
    const fromWindow = new Date(now.getTime() + 23 * 60 * 60 * 1000);

    const upcomingAppointments: Appointment[] =
      await this.appointmentRepository.findUpcoming(fromWindow, in24Hours);

    for (const appt of upcomingAppointments) {
      // Ignoramos si están canceladas
      if (appt.status === AppointmentStatus.CANCELLED) {
        continue;
      }

      try {
        const client = await this.clientRepository.findById(appt.clientId);
        if (!client) continue;

        // Ideal para mantenimiento o follow_up
        const userTemplates = await this.templateRepository.findByCompanyId(
          appt.companyId || '',
        );
        const template =
          userTemplates.find((t) => t.stage === ClientStage.FOLLOW_UP) ||
          userTemplates.find((t) => t.stage === ClientStage.FIRST_CONTACT);

        let message = `Hola ${client.firstName}, te recordamos que tienes una cita programada para mañana a las ${appt.startTime.toLocaleTimeString('es-ES')}.`;

        if (template) {
          const pendingPayment = await this.paymentRepository.findActivePending(
            PaymentSourceType.APPOINTMENT,
            appt.id,
          );
          message = this.templateRenderer.render(template.messageBody, {
            name: client.firstName,
            paymentUrl: pendingPayment?.checkoutUrl || '',
            date: appt.startTime.toLocaleString('es-ES'),
          });
        }

        await this.messagingProvider.sendMessage(
          appt.userId,
          client.phoneNumber,
          message,
        );
        this.logger.debug(
          `Reminder sent to ${client.phoneNumber} for appointment ${appt.id}`,
        );
      } catch (err: unknown) {
        this.logger.error(
          `Failed to send reminder for appointment ${appt.id}`,
          err instanceof Error
            ? (err.stack ?? err.message)
            : JSON.stringify(err),
        );
      }
    }
  }
}
