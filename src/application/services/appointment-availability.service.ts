import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AppointmentAvailabilityInput,
  AppointmentAvailabilityResult,
  AppointmentAvailabilitySource,
  AppointmentBusyInterval,
} from '@domain/models/appointment-availability.model';
import {
  APPOINTMENT_REPOSITORY,
  type IAppointmentRepository,
} from '@domain/ports/appointment.repository.interface';
import {
  GOOGLE_CALENDAR_PROVIDER,
  type IGoogleCalendarProvider,
} from '@domain/ports/google-calendar.provider.interface';
import {
  GOOGLE_INTEGRATION_REPOSITORY,
  type IGoogleIntegrationRepository,
} from '@domain/ports/google-integration.repository.interface';
import {
  TOKEN_CIPHER,
  type ITokenCipher,
} from '@domain/ports/token-cipher.interface';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '@domain/ports/user.repository.interface';

@Injectable()
export class AppointmentAvailabilityService {
  private readonly logger = new Logger(AppointmentAvailabilityService.name);
  private readonly timeZone: string;

  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointments: IAppointmentRepository,
    @Inject(USER_REPOSITORY)
    private readonly users: IUserRepository,
    @Inject(GOOGLE_INTEGRATION_REPOSITORY)
    private readonly integrations: IGoogleIntegrationRepository,
    @Inject(GOOGLE_CALENDAR_PROVIDER)
    private readonly calendar: IGoogleCalendarProvider,
    @Inject(TOKEN_CIPHER)
    private readonly cipher: ITokenCipher,
    config: ConfigService,
  ) {
    this.timeZone = config.get<string>(
      'GOOGLE_CALENDAR_TIME_ZONE',
      'America/Lima',
    );
  }

  async checkAvailability(
    input: AppointmentAvailabilityInput,
  ): Promise<AppointmentAvailabilityResult> {
    this.assertValidInterval(input.startTime, input.endTime);
    const user = await this.users.findById(input.userId);
    if (!user?.companyId || user.companyId !== input.companyId) {
      throw new NotFoundException(`User ${input.userId} not found`);
    }

    let excludeEventId: string | undefined;
    if (input.excludeAppointmentId) {
      const appointment = await this.appointments.findById(
        input.excludeAppointmentId,
      );
      if (
        !appointment ||
        appointment.userId !== input.userId ||
        appointment.companyId !== input.companyId
      ) {
        throw new NotFoundException(
          `Appointment ${input.excludeAppointmentId} not found`,
        );
      }
      excludeEventId = appointment.externalEventId ?? undefined;
    }

    const localConflicts = await this.findLocalConflicts(
      input.userId,
      input.startTime,
      input.endTime,
      input.excludeAppointmentId,
    );
    if (localConflicts.length > 0) {
      return {
        available: false,
        externalCalendarChecked: false,
        conflicts: localConflicts,
      };
    }

    if (!this.shouldCheckGoogle(user)) {
      return {
        available: true,
        externalCalendarChecked: false,
        conflicts: [],
      };
    }

    const integration = await this.integrations.findByUserId(input.userId);
    if (!integration?.refreshTokenEncrypted) {
      throw this.externalCalendarUnavailable();
    }

    const context = `google:${input.userId}`;
    try {
      const result = await this.calendar.listBusyIntervals(
        {
          accessToken: this.cipher.decrypt(
            integration.accessTokenEncrypted,
            context,
          ),
          refreshToken: this.cipher.decrypt(
            integration.refreshTokenEncrypted,
            context,
          ),
          expiryDate: integration.expiresAt?.getTime(),
        },
        integration.calendarId || 'primary',
        {
          startTime: input.startTime,
          endTime: input.endTime,
          timeZone: this.timeZone,
          excludeEventId,
        },
      );

      await this.integrations.updateTokens(input.userId, {
        accessTokenEncrypted: this.cipher.encrypt(
          result.credentials.accessToken,
          context,
        ),
        refreshTokenEncrypted: result.credentials.refreshToken
          ? this.cipher.encrypt(result.credentials.refreshToken, context)
          : undefined,
        expiresAt: result.credentials.expiryDate
          ? new Date(result.credentials.expiryDate)
          : undefined,
      });

      const conflicts: AppointmentBusyInterval[] = result.intervals.map(
        (interval) => ({
          source: AppointmentAvailabilitySource.GOOGLE,
          startTime: interval.startTime,
          endTime: interval.endTime,
        }),
      );
      return {
        available: conflicts.length === 0,
        externalCalendarChecked: true,
        conflicts,
      };
    } catch (error) {
      this.logger.warn(
        `Google availability check failed for user ${input.userId}`,
      );
      throw this.externalCalendarUnavailable(error);
    }
  }

  async assertAvailable(input: AppointmentAvailabilityInput): Promise<void> {
    const result = await this.checkAvailability(input);
    if (!result.available) {
      throw new ConflictException({
        code: 'APPOINTMENT_TIME_CONFLICT',
        message: 'The selected appointment time is already occupied',
        ...result,
      });
    }
  }

  async findLocalConflicts(
    userId: string,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: string,
  ): Promise<AppointmentBusyInterval[]> {
    const appointments = await this.appointments.findOverlappingScheduled(
      userId,
      startTime,
      endTime,
      excludeAppointmentId,
    );
    return appointments.map((appointment) => ({
      source: AppointmentAvailabilitySource.AGENDA,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      appointmentId: appointment.id,
    }));
  }

  private shouldCheckGoogle(user: {
    googleId?: string | null;
    integrationProvider?: string;
    syncCalendar?: boolean;
  }): boolean {
    return Boolean(
      user.googleId &&
      user.integrationProvider === 'google' &&
      user.syncCalendar !== false,
    );
  }

  private assertValidInterval(startTime: Date, endTime: Date): void {
    const start = startTime.getTime();
    const end = endTime.getTime();
    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
      throw new BadRequestException(
        'Appointment end time must be after its start time',
      );
    }
    if (start < Date.now()) {
      throw new BadRequestException(
        'Appointment start time cannot be in the past',
      );
    }
  }

  private externalCalendarUnavailable(
    _error?: unknown,
  ): ServiceUnavailableException {
    return new ServiceUnavailableException({
      code: 'EXTERNAL_CALENDAR_AVAILABILITY_UNAVAILABLE',
      message:
        'Google Calendar availability could not be verified. Try again before saving.',
    });
  }
}
