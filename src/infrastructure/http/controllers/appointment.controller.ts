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
import { CurrentUser } from '@infrastructure/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@infrastructure/auth/strategies/jwt.strategy';
import { CreateAppointmentDto } from '../dtos/appointment/create-appointment.dto';
import { UpdateAppointmentDto } from '../dtos/appointment/update-appointment.dto';
import { CheckAppointmentAvailabilityDto } from '../dtos/appointment/check-appointment-availability.dto';
import { AppointmentAvailabilityService } from '@application/services/appointment-availability.service';

@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentController {
  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly appointmentAvailability: AppointmentAvailabilityService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateAppointmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.appointmentService.createAppointment({
      ...dto,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      companyId: user.companyId,
      userId: user.userId,
    });
  }

  @Get()
  findAllByCompany(@CurrentUser() user: AuthenticatedUser) {
    return this.appointmentService.getAppointmentsByCompany(
      user.companyId || '',
    );
  }

  @Post('availability')
  @HttpCode(HttpStatus.OK)
  checkAvailability(
    @Body() dto: CheckAppointmentAvailabilityDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.appointmentAvailability.checkAvailability({
      userId: user.userId,
      companyId: user.companyId || '',
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      excludeAppointmentId: dto.excludeAppointmentId,
    });
  }

  @Get('client/:clientId')
  findAllByClient(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.appointmentService.getAppointmentsByClient(
      clientId,
      user.companyId || '',
    );
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.appointmentService.getAppointmentById(id, user.companyId || '');
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.appointmentService.updateAppointment(
      id,
      {
        ...dto,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
      },
      user.companyId || '',
    );
  }

  @Post(':id/calendar-sync/retry')
  retryCalendarSync(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.appointmentService.retryCalendarSync(id, user.companyId || '');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.appointmentService.deleteAppointment(id, user.companyId || '');
  }
}
