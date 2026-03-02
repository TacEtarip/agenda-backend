import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IAppointmentRepository } from '@domain/ports/appointment.repository.interface';
import { Appointment } from '@domain/models/appointment.model';
import { AppointmentOrmEntity } from '../entities/appointment.orm-entity';
import { AppointmentMapper } from '../mappers/appointment.mapper';

@Injectable()
export class AppointmentRepository implements IAppointmentRepository {
  constructor(
    @InjectRepository(AppointmentOrmEntity)
    private readonly repository: Repository<AppointmentOrmEntity>,
  ) {}

  async create(appointment: Partial<Appointment>): Promise<Appointment> {
    const ormEntity = AppointmentMapper.toOrmEntity(appointment);
    const savedEntity = await this.repository.save(ormEntity);
    return AppointmentMapper.toDomain(savedEntity);
  }

  async findById(id: string): Promise<Appointment | null> {
    const ormEntity = await this.repository.findOne({ where: { id } });
    return ormEntity ? AppointmentMapper.toDomain(ormEntity) : null;
  }

  async findAllByUserId(userId: string): Promise<Appointment[]> {
    const ormEntities = await this.repository.find({ where: { userId } });
    return ormEntities.map((entity) => AppointmentMapper.toDomain(entity));
  }

  async findAllByClientId(clientId: string): Promise<Appointment[]> {
    const ormEntities = await this.repository.find({ where: { clientId } });
    return ormEntities.map((entity) => AppointmentMapper.toDomain(entity));
  }

  async update(
    id: string,
    appointment: Partial<Appointment>,
  ): Promise<Appointment> {
    await this.repository.update(
      id,
      AppointmentMapper.toOrmEntity(appointment),
    );
    const updatedEntity = await this.repository.findOne({ where: { id } });
    if (!updatedEntity) throw new Error('Appointment not found after update');
    return AppointmentMapper.toDomain(updatedEntity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
