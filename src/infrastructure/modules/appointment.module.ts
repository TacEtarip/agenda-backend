import { Module } from '@nestjs/common';
import { AppointmentService } from '@application/services/appointment.service';
import { AppointmentReminderCron } from '@application/services/appointment-reminder.cron';
import { AppointmentController } from '../http/controllers/appointment.controller';
import { DatabaseModule } from '../database/database.module';
import { MessagingModule } from '../messaging/messaging.module';
import { MessageTemplateModule } from './message-template.module';

@Module({
  imports: [DatabaseModule, MessagingModule, MessageTemplateModule],
  controllers: [AppointmentController],
  providers: [AppointmentService, AppointmentReminderCron],
  exports: [AppointmentService],
})
export class AppointmentModule {}
