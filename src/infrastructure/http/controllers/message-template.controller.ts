import { MessageTemplateService } from '@application/services/message-template.service';
import { TemplateRendererService } from '@application/services/template-renderer.service';
import { CurrentUser } from '@infrastructure/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@infrastructure/auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '@infrastructure/auth/strategies/jwt.strategy';
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
import { PreviewMessageTemplateDto } from '../dtos/message-template/preview-template.dto';
import { UpdateMessageTemplateDto } from '../dtos/message-template/update-template.dto';
import { UpsertMessageTemplateDto } from '../dtos/message-template/upsert-template.dto';

@UseGuards(JwtAuthGuard)
@Controller('message-templates')
export class MessageTemplateController {
  constructor(
    private readonly messageTemplateService: MessageTemplateService,
    private readonly templateRenderer: TemplateRendererService,
  ) {}

  @Get('metadata')
  getMetadata() {
    return { variables: this.templateRenderer.getMetadata() };
  }

  @Post('preview')
  preview(@Body() dto: PreviewMessageTemplateDto) {
    return this.templateRenderer.preview(dto.messageBody);
  }

  @Post()
  async createTemplate(
    @Body() dto: UpsertMessageTemplateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.messageTemplateService.createTemplate(
      user.companyId || '',
      user.userId,
      dto.stage,
      dto.messageBody,
    );
  }

  @Put(':id')
  async updateTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMessageTemplateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.messageTemplateService.updateTemplate(
      id,
      dto,
      user.companyId || '',
    );
  }

  @Get()
  async getTemplatesByCompany(@CurrentUser() user: AuthenticatedUser) {
    return this.messageTemplateService.getTemplatesByCompany(
      user.companyId || '',
    );
  }

  @Get(':id')
  async getTemplateById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.messageTemplateService.getTemplateById(
      id,
      user.companyId || '',
    );
  }

  @Delete(':id')
  async deleteTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.messageTemplateService.deleteTemplate(id, user.companyId || '');
  }
}
