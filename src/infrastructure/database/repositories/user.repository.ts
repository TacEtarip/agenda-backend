import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserRepository } from '@domain/ports/user.repository.interface';
import { User } from '@domain/models/user.model';
import { UserOrmEntity } from '../entities/user.orm-entity';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repository: Repository<UserOrmEntity>,
  ) {}

  async create(user: Partial<User>): Promise<User> {
    const ormEntity = UserMapper.toOrmEntity(user);
    const savedEntity = await this.repository.save(ormEntity);
    return UserMapper.toDomain(savedEntity);
  }

  async findById(id: string): Promise<User | null> {
    const ormEntity = await this.repository.findOne({ where: { id } });
    return ormEntity ? UserMapper.toDomain(ormEntity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const ormEntity = await this.repository.findOne({ where: { email } });
    return ormEntity ? UserMapper.toDomain(ormEntity) : null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const ormEntity = await this.repository.findOne({ where: { googleId } });
    return ormEntity ? UserMapper.toDomain(ormEntity) : null;
  }

  async update(id: string, user: Partial<User>): Promise<User> {
    await this.repository.update(id, UserMapper.toOrmEntity(user));
    const updatedEntity = await this.repository.findOne({ where: { id } });
    if (!updatedEntity) throw new Error('User not found after update');
    return UserMapper.toDomain(updatedEntity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
