import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { MessageTemplateService } from '@application/services/message-template.service';
import { UpsertMessageTemplateDto } from '../dtos/message-template/upsert-template.dto';

@Controller('message-templates')
export class MessageTemplateController {
  constructor(
    private readonly messageTemplateService: MessageTemplateService,
  ) {}

  @Post()
  async upsertTemplate(@Body() dto: UpsertMessageTemplateDto) {
    return this.messageTemplateService.createOrUpdateTemplate(
      dto.userId,
      dto.stage,
      dto.messageBody,
    );
  }

  @Get('user/:userId')
  async getTemplatesByUser(@Param('userId') userId: string) {
    return this.messageTemplateService.getTemplatesByUserId(userId);
  }

  @Get(':id')
  async getTemplateById(@Param('id') id: string) {
    return this.messageTemplateService.getTemplateById(id);
  }

  @Delete(':id')
  async deleteTemplate(@Param('id') id: string) {
    return this.messageTemplateService.deleteTemplate(id);
  }
}
