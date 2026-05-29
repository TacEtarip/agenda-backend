import { ClientStage } from '@domain/enums/client-stage.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StageOrmEntity } from './stage.orm-entity';
import { CompanyOrmEntity } from './company.orm-entity';

@Entity('message_templates')
export class MessageTemplateOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'company_id', nullable: true })
  companyId!: string;

  @ManyToOne(
    () => CompanyOrmEntity,
    (company: CompanyOrmEntity) => company.messageTemplates,
  )
  @JoinColumn({ name: 'company_id' })
  company!: CompanyOrmEntity;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({
    type: 'enum',
    enum: ClientStage,
    enumName: 'client_stage_enum',
  })
  stage!: ClientStage;

  @Column({ name: 'message_body', type: 'text' })
  messageBody!: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;

  @ManyToOne(() => StageOrmEntity, (stage) => stage.messageTemplates, {
    nullable: false,
  })
  @JoinColumn({ name: 'stage', referencedColumnName: 'code' })
  stageDefinition!: StageOrmEntity;
}
