import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { MessageTemplateService } from '@application/services/message-template.service';
import { UpsertMessageTemplateDto } from '../dtos/message-template/upsert-template.dto';
import { UpdateMessageTemplateDto } from '../dtos/message-template/update-template.dto';

@Controller('message-templates')
export class MessageTemplateController {
  constructor(
    private readonly messageTemplateService: MessageTemplateService,
  ) {}

  @Post()
  async createTemplate(@Body() dto: UpsertMessageTemplateDto) {
    return this.messageTemplateService.createTemplate(
      dto.userId,
      dto.stage,
      dto.messageBody,
    );
  }

  @Put(':id')
  async updateTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMessageTemplateDto,
  ) {
    return this.messageTemplateService.updateTemplate(id, dto);
  }

  @Get('user/:userId')
  async getTemplatesByUser(
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.messageTemplateService.getTemplatesByUserId(userId);
  }

  @Get(':id')
  async getTemplateById(@Param('id', ParseUUIDPipe) id: string) {
    return this.messageTemplateService.getTemplateById(id);
  }

  @Delete(':id')
  async deleteTemplate(@Param('id', ParseUUIDPipe) id: string) {
    return this.messageTemplateService.deleteTemplate(id);
  }
}
