import { MessageTemplate } from '@domain/models/message-template.model';
import { MessageTemplateOrmEntity } from '../entities/message-template.orm-entity';

export class MessageTemplateMapper {
  static toDomain(ormEntity: MessageTemplateOrmEntity): MessageTemplate {
    return new MessageTemplate({
      id: ormEntity.id,
      userId: ormEntity.userId,
      stage: ormEntity.stage,
      messageBody: ormEntity.messageBody,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toOrmEntity(
    domain: Partial<MessageTemplate>,
  ): MessageTemplateOrmEntity {
    const ormEntity = new MessageTemplateOrmEntity();
    if (domain.id) ormEntity.id = domain.id;
    if (domain.userId) ormEntity.userId = domain.userId;
    if (domain.stage) ormEntity.stage = domain.stage;
    if (domain.messageBody) ormEntity.messageBody = domain.messageBody;
    return ormEntity;
  }
}
