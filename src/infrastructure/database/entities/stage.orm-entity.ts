import { ClientStage } from '@domain/enums/client-stage.enum';
import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { ClientOrmEntity } from './client.orm-entity';
import { MessageTemplateOrmEntity } from './message-template.orm-entity';

@Entity('stages')
export class StageOrmEntity {
  @PrimaryColumn({
    type: 'enum',
    enum: ClientStage,
    enumName: 'client_stage_enum',
  })
  code!: ClientStage;

  @Column({ unique: true })
  name!: string;

  @Column({ name: 'sort_order', type: 'int', unique: true })
  sortOrder!: number;

  @OneToMany(() => ClientOrmEntity, (client) => client.stageDefinition)
  clients!: ClientOrmEntity[];

  @OneToMany(
    () => MessageTemplateOrmEntity,
    (messageTemplate) => messageTemplate.stageDefinition,
  )
  messageTemplates!: MessageTemplateOrmEntity[];
}
