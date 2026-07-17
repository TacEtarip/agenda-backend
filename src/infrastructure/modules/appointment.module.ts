import { Module } from '@nestjs/common';
import { AppointmentService } from '@application/services/appointment.service';
import { AppointmentReminderCron } from '@application/services/appointment-reminder.cron';
import { AppointmentController } from '../http/controllers/appointment.controller';
import { DatabaseModule } from '../database/database.module';
import { MessagingModule } from '../messaging/messaging.module';
import { MessageTemplateModule } from './message-template.module';
import { GoogleIntegrationModule } from './google-integration.module';
import { GoogleCalendarSyncService } from '@application/services/google-calendar-sync.service';
import { AppointmentExpirationCron } from '@application/services/appointment-expiration.cron';

@Module({
  imports: [
    DatabaseModule,
    MessagingModule,
    MessageTemplateModule,
    GoogleIntegrationModule,
  ],
  controllers: [AppointmentController],
  providers: [
    AppointmentService,
    AppointmentReminderCron,
    AppointmentExpirationCron,
    GoogleCalendarSyncService,
  ],
  exports: [AppointmentService, GoogleCalendarSyncService],
})
export class AppointmentModule {}
