import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@infrastructure/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@infrastructure/auth/decorators/current-user.decorator';
import type { JwtPayload } from '@infrastructure/auth/strategies/jwt.strategy';
import { MessageTemplateService } from '@application/services/message-template.service';
import { UpsertMessageTemplateDto } from '../dtos/message-template/upsert-template.dto';
import { UpdateMessageTemplateDto } from '../dtos/message-template/update-template.dto';

@UseGuards(JwtAuthGuard)
@Controller('message-templates')
export class MessageTemplateController {
  constructor(
    private readonly messageTemplateService: MessageTemplateService,
  ) {}

  @Post()
  async createTemplate(
    @Body() dto: UpsertMessageTemplateDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.messageTemplateService.createTemplate(
      user.companyId || '',
      user.sub,
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

  @Get()
  async getTemplatesByCompany(@CurrentUser() user: JwtPayload) {
    return this.messageTemplateService.getTemplatesByCompany(
      user.companyId || '',
    );
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
