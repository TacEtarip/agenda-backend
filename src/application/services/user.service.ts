import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { USER_REPOSITORY } from '@domain/ports/user.repository.interface';
import type { IUserRepository } from '@domain/ports/user.repository.interface';
import { User } from '@domain/models/user.model';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
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
    return this.userRepository.update(id, data);
  }
}
