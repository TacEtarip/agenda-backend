import type { IAppointmentRepository } from '@domain/ports/appointment.repository.interface';
import { APPOINTMENT_REPOSITORY } from '@domain/ports/appointment.repository.interface';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

const EXPIRATION_DELAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AppointmentExpirationCron implements OnModuleInit {
  private readonly logger = new Logger(AppointmentExpirationCron.name);

  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: IAppointmentRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.expireOverdueAppointments();
  }

  @Cron(CronExpression.EVERY_HOUR)
  async expireOverdueAppointments(): Promise<number> {
    const cutoff = new Date(Date.now() - EXPIRATION_DELAY_MS);
    const expiredCount =
      await this.appointmentRepository.expireScheduledBefore(cutoff);

    if (expiredCount > 0) {
      this.logger.log(`Marked ${expiredCount} appointment(s) as expired`);
    }

    return expiredCount;
  }
}
