import { Injectable, Inject, ConflictException, Logger } from '@nestjs/common';
import { USER_REPOSITORY } from '@domain/ports/user.repository.interface';
import type { IUserRepository } from '@domain/ports/user.repository.interface';
import { User } from '@domain/models/user.model';
import { APPOINTMENT_REPOSITORY } from '@domain/ports/appointment.repository.interface';
import type { IAppointmentRepository } from '@domain/ports/appointment.repository.interface';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointments: IAppointmentRepository,
  ) {}

  async createUser(data: Partial<User>): Promise<User> {
    if (!data.email) {
      throw new Error('Email is required to create a user');
    }

    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    return this.userRepository.create(data);
  }

  async getUser(id: string, companyId?: string): Promise<User | null> {
    const user = await this.userRepository.findById(id);
    if (!user) return null;
    if (companyId && user.companyId !== companyId) return null;
    return user;
  }

  async updateUserSettings(id: string, data: Partial<User>): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    const updated = await this.userRepository.update(id, data);
    if (
      updated.googleId &&
      updated.integrationProvider === 'google' &&
      updated.syncCalendar
    ) {
      try {
        await this.appointments.scheduleAllForUser(id);
      } catch (error) {
        this.logger.warn(
          `Could not schedule appointments after enabling Google Calendar for user ${id}`,
          error,
        );
      }
    }
    return updated;
  }

  async updateUserProfile(id: string, data: Partial<User>): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    if (data.email && data.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('User with this email already exists');
      }
    }

    return this.userRepository.update(id, data);
  }
}
