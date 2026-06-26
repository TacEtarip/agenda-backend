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

  async createTemplate(
    companyId: string,
    userId: string,
    stage: ClientStage,
    messageBody: string,
  ): Promise<MessageTemplate> {
    const newTemplate = new MessageTemplate({
      companyId,
      userId,
      stage,
      messageBody,
    });
    return this.templateRepository.create(newTemplate);
  }

  async updateTemplate(
    id: string,
    updates: Partial<Pick<MessageTemplate, 'stage' | 'messageBody'>>,
    companyId: string,
  ): Promise<MessageTemplate> {
    const template = await this.templateRepository.findById(id);
    if (!template || template.companyId !== companyId) {
      throw new NotFoundException(`MessageTemplate with ID ${id} not found`);
    }

    return this.templateRepository.update(id, updates);
  }

  async getTemplateById(id: string, companyId: string): Promise<MessageTemplate> {
    const template = await this.templateRepository.findById(id);
    if (!template || template.companyId !== companyId) {
      throw new NotFoundException(`MessageTemplate with ID ${id} not found`);
    }
    return template;
  }

  async getTemplatesByCompany(companyId: string): Promise<MessageTemplate[]> {
    return this.templateRepository.findByCompanyId(companyId);
  }

  async deleteTemplate(id: string, companyId: string): Promise<boolean> {
    await this.getTemplateById(id, companyId);
    return this.templateRepository.delete(id);
  }
}
