import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientStage } from '@domain/enums/client-stage.enum';
import { Repository } from 'typeorm';
import { StageOrmEntity } from './entities/stage.orm-entity';

const STAGE_SEED_DATA: Pick<StageOrmEntity, 'code' | 'name' | 'sortOrder'>[] = [
  {
    code: ClientStage.FIRST_CONTACT,
    name: 'Primer contacto',
    sortOrder: 1,
  },
  {
    code: ClientStage.FOLLOW_UP,
    name: 'Seguimiento',
    sortOrder: 2,
  },
  {
    code: ClientStage.POST_SALE,
    name: 'Postventa',
    sortOrder: 3,
  },
  {
    code: ClientStage.MAINTENANCE,
    name: 'Mantenimiento',
    sortOrder: 4,
  },
  {
    code: ClientStage.CLOSED_SALE,
    name: 'Venta cerrada',
    sortOrder: 5,
  },
];

@Injectable()
export class StageSeedService implements OnModuleInit {
  constructor(
    @InjectRepository(StageOrmEntity)
    private readonly stageRepository: Repository<StageOrmEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.stageRepository.upsert(STAGE_SEED_DATA, ['code']);
  }
}
