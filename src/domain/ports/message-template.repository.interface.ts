import { MessageTemplate } from '../models/message-template.model';
import { ClientStage } from '../models/client.model';

export const MESSAGE_TEMPLATE_REPOSITORY = 'MESSAGE_TEMPLATE_REPOSITORY';

export interface IMessageTemplateRepository {
  create(template: MessageTemplate): Promise<MessageTemplate>;
  findById(id: string): Promise<MessageTemplate | null>;
  findByUserId(userId: string): Promise<MessageTemplate[]>;
  findByUserAndStage(
    userId: string,
    stage: ClientStage,
  ): Promise<MessageTemplate | null>;
  update(
    id: string,
    updates: Partial<MessageTemplate>,
  ): Promise<MessageTemplate>;
  delete(id: string): Promise<boolean>;
}
