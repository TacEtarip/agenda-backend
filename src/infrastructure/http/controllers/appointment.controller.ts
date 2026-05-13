import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AppointmentService } from '@application/services/appointment.service';
import { JwtAuthGuard } from '@infrastructure/auth/guards/jwt-auth.guard';
import { CreateAppointmentDto } from '../dtos/appointment/create-appointment.dto';
import { UpdateAppointmentDto } from '../dtos/appointment/update-appointment.dto';

@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  create(@Body() dto: CreateAppointmentDto) {
    const { requestPaymentLink, ...appointmentData } = dto;
    return this.appointmentService.createAppointment(
      {
        ...appointmentData,
        startTime: new Date(appointmentData.startTime),
        endTime: new Date(appointmentData.endTime),
      },
      requestPaymentLink,
    );
  }

  @Get('user/:userId')
  findAllByUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.appointmentService.getAppointmentsByUser(userId);
  }

  @Get('client/:clientId')
  findAllByClient(@Param('clientId', ParseUUIDPipe) clientId: string) {
    return this.appointmentService.getAppointmentsByClient(clientId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentService.getAppointmentById(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointmentService.updateAppointment(id, {
      ...dto,
      startTime: dto.startTime ? new Date(dto.startTime) : undefined,
      endTime: dto.endTime ? new Date(dto.endTime) : undefined,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentService.deleteAppointment(id);
  }
}
