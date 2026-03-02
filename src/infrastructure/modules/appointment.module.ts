import { Module } from '@nestjs/common';
import { AppointmentService } from '@application/services/appointment.service';
import { AppointmentController } from '../http/controllers/appointment.controller';

@Module({
  controllers: [AppointmentController],
  providers: [AppointmentService],
  exports: [AppointmentService],
})
export class AppointmentModule {}
