import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MessageTemplate } from '@domain/models/message-template.model';
import { ClientStage } from '@domain/enums/client-stage.enum';
import type { IMessageTemplateRepository } from '@domain/ports/message-template.repository.interface';
import { MESSAGE_TEMPLATE_REPOSITORY } from '@domain/ports/message-template.repository.interface';

@Injectable()
export class MessageTemplateService {
  constructor(
    @Inject(MESSAGE_TEMPLATE_REPOSITORY)
    private readonly templateRepository: IMessageTemplateRepository,
  ) {}

  async createOrUpdateTemplate(
    userId: string,
    stage: ClientStage,
    messageBody: string,
  ): Promise<MessageTemplate> {
    const existing = await this.templateRepository.findByUserAndStage(
      userId,
      stage,
    );
    if (existing) {
      return this.templateRepository.update(existing.id, { messageBody });
    }

    const newTemplate = new MessageTemplate({ userId, stage, messageBody });
    return this.templateRepository.create(newTemplate);
  }

  async getTemplateById(id: string): Promise<MessageTemplate> {
    const template = await this.templateRepository.findById(id);
    if (!template) {
      throw new NotFoundException(`MessageTemplate with ID ${id} not found`);
    }
    return template;
  }

  async getTemplatesByUserId(userId: string): Promise<MessageTemplate[]> {
    return this.templateRepository.findByUserId(userId);
  }

  async deleteTemplate(id: string): Promise<boolean> {
    return this.templateRepository.delete(id);
  }
}
