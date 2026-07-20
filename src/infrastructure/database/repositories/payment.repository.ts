import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import { PaymentStatus } from '@domain/enums/payment-status.enum';
import { PaymentSourceType } from '@domain/enums/payment-source-type.enum';
import {
  IPaymentRepository,
  PaymentListFilters,
  PaymentListResult,
} from '@domain/ports/payment.repository.interface';
import { Payment } from '@domain/models/payment.model';
import { PaymentOrmEntity } from '../entities/payment.orm-entity';
import { PaymentMapper } from '../mappers/payment.mapper';

@Injectable()
export class PaymentRepository implements IPaymentRepository {
  constructor(
    @InjectRepository(PaymentOrmEntity)
    private readonly repository: Repository<PaymentOrmEntity>,
  ) {}

  async create(payment: Partial<Payment>): Promise<Payment> {
    const saved = await this.repository.save(
      this.repository.create(PaymentMapper.toOrmEntity(payment)),
    );
    return PaymentMapper.toDomain(saved);
  }

  async findById(id: string): Promise<Payment | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? PaymentMapper.toDomain(entity) : null;
  }

  async findByProviderPaymentId(
    providerPaymentId: string,
  ): Promise<Payment | null> {
    const entity = await this.repository.findOne({
      where: { providerPaymentId },
    });
    return entity ? PaymentMapper.toDomain(entity) : null;
  }

  async findBySource(
    sourceType: PaymentSourceType,
    sourceId: string,
  ): Promise<Payment[]> {
    const entities = await this.repository.find({
      where: this.sourceWhere(sourceType, sourceId),
      order: { createdAt: 'DESC' },
    });
    return entities.map(PaymentMapper.toDomain);
  }

  async findActivePending(
    sourceType: PaymentSourceType,
    sourceId: string,
  ): Promise<Payment | null> {
    const entity = await this.repository.findOne({
      where: {
        ...this.sourceWhere(sourceType, sourceId),
        status: PaymentStatus.PENDING,
      },
      order: { createdAt: 'DESC' },
    });
    return entity ? PaymentMapper.toDomain(entity) : null;
  }

  async findPaid(
    sourceType: PaymentSourceType,
    sourceId: string,
  ): Promise<Payment | null> {
    const entity = await this.repository.findOne({
      where: {
        ...this.sourceWhere(sourceType, sourceId),
        status: PaymentStatus.PAID,
      },
      order: { createdAt: 'DESC' },
    });
    return entity ? PaymentMapper.toDomain(entity) : null;
  }

  async findAll(filters: PaymentListFilters): Promise<PaymentListResult> {
    const where: FindOptionsWhere<PaymentOrmEntity> = {
      companyId: filters.companyId,
    };
    if (filters.status) where.status = filters.status;
    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.sourceType && filters.sourceId)
      Object.assign(
        where,
        this.sourceWhere(filters.sourceType, filters.sourceId),
      );
    else if (filters.sourceType === PaymentSourceType.APPOINTMENT)
      where.appointmentId = Not(IsNull());
    else if (filters.sourceType === PaymentSourceType.CLIENT_PRODUCT)
      where.clientProductId = Not(IsNull());
    if (filters.from && filters.to)
      where.createdAt = Between(filters.from, filters.to);
    else if (filters.from) where.createdAt = MoreThanOrEqual(filters.from);
    else if (filters.to) where.createdAt = LessThanOrEqual(filters.to);

    const [entities, total] = await this.repository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    });
    return {
      items: entities.map(PaymentMapper.toDomain),
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async update(id: string, payment: Partial<Payment>): Promise<Payment> {
    await this.repository.update(id, PaymentMapper.toOrmEntity(payment));
    const updated = await this.repository.findOneOrFail({ where: { id } });
    return PaymentMapper.toDomain(updated);
  }

  async transitionStatus(
    id: string,
    companyId: string,
    fromStatus: PaymentStatus,
    toStatus: PaymentStatus,
    payment: Partial<Payment>,
  ): Promise<Payment | null> {
    const result = await this.repository
      .createQueryBuilder()
      .update(PaymentOrmEntity)
      .set(PaymentMapper.toOrmEntity({ ...payment, status: toStatus }))
      .where('id = :id', { id })
      .andWhere('company_id = :companyId', { companyId })
      .andWhere('status = :fromStatus', { fromStatus })
      .execute();
    if (result.affected !== 1) return null;
    const updated = await this.repository.findOne({ where: { id, companyId } });
    return updated ? PaymentMapper.toDomain(updated) : null;
  }

  async cancelPendingForSource(
    sourceType: PaymentSourceType,
    sourceId: string,
  ): Promise<void> {
    await this.repository.update(
      {
        ...this.sourceWhere(sourceType, sourceId),
        status: PaymentStatus.PENDING,
      },
      { status: PaymentStatus.CANCELLED },
    );
  }

  private sourceWhere(
    sourceType: PaymentSourceType,
    sourceId: string,
  ): FindOptionsWhere<PaymentOrmEntity> {
    return sourceType === PaymentSourceType.APPOINTMENT
      ? { appointmentId: sourceId }
      : { clientProductId: sourceId };
  }
}
