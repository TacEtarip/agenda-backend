import { MessageTemplate } from '../models/message-template.model';

export const MESSAGE_TEMPLATE_REPOSITORY = 'MESSAGE_TEMPLATE_REPOSITORY';

export interface IMessageTemplateRepository {
  create(template: MessageTemplate): Promise<MessageTemplate>;
  findById(id: string): Promise<MessageTemplate | null>;
  findByCompanyId(companyId: string): Promise<MessageTemplate[]>;
  update(
    id: string,
    updates: Partial<MessageTemplate>,
  ): Promise<MessageTemplate>;
  delete(id: string): Promise<boolean>;
}
