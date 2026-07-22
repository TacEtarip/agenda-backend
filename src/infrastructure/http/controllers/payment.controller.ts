import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Post,
  Query,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from '@application/services/payment.service';
import { PaymentSourceType } from '@domain/enums/payment-source-type.enum';
import { JwtAuthGuard } from '@infrastructure/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@infrastructure/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@infrastructure/auth/strategies/jwt.strategy';
import { CreatePaymentLinkDto } from '../dtos/payment/create-payment-link.dto';
import { RegisterManualPaymentDto } from '../dtos/payment/register-manual-payment.dto';
import { ListPaymentsQueryDto } from '../dtos/payment/list-payments-query.dto';
import { PaymentWebhookDto } from '../dtos/payment/payment-webhook.dto';
import { UpdateYapeSettingsDto } from '../dtos/payment/update-yape-settings.dto';
import { CreateYapePaymentRequestDto } from '../dtos/payment/create-yape-payment-request.dto';
import { ConfirmYapePaymentDto } from '../dtos/payment/confirm-yape-payment.dto';
import { UpdateCulqiSettingsDto } from '../dtos/payment/update-culqi-settings.dto';
import { CulqiConfigurationService } from '@application/services/culqi-configuration.service';

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly culqiConfiguration: CulqiConfigurationService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('configuration/culqi')
  getCulqiConfiguration(@CurrentUser() user: AuthenticatedUser) {
    return this.culqiConfiguration.getConfiguration(user.companyId || '');
  }

  @UseGuards(JwtAuthGuard)
  @Patch('configuration/culqi')
  updateCulqiConfiguration(
    @Body() dto: UpdateCulqiSettingsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.culqiConfiguration.updateConfiguration(
      user.companyId || '',
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('configuration/yape')
  getYapeConfiguration(@CurrentUser() user: AuthenticatedUser) {
    return this.paymentService.getYapeConfiguration(user.companyId || '');
  }

  @UseGuards(JwtAuthGuard)
  @Patch('configuration/yape')
  updateYapeConfiguration(
    @Body() dto: UpdateYapeSettingsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentService.updateYapeConfiguration(user.companyId || '', {
      enabled: dto.enabled,
      phone: dto.phone,
      accountName: dto.accountName,
      qrImageDataUrl: dto.qrImageDataUrl ?? undefined,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('yape-requests')
  createYapeRequest(
    @Body() dto: CreateYapePaymentRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentService.createYapeRequest(dto, user.companyId || '');
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/confirm-yape')
  confirmYapePayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmYapePaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentService.confirmYapePayment(
      id,
      user.companyId,
      user.userId,
      dto.reference,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('links')
  createLink(
    @Body() dto: CreatePaymentLinkDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentService.createLink(dto, user.companyId || '');
  }

  @UseGuards(JwtAuthGuard)
  @Post('manual')
  registerManual(
    @Body() dto: RegisterManualPaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentService.registerManual(dto, user.companyId || '');
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  list(
    @Query() query: ListPaymentsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentService.list(query, user.companyId || '');
  }

  @UseGuards(JwtAuthGuard)
  @Get('source/:sourceType/:sourceId')
  sourceHistory(
    @Param('sourceType', new ParseEnumPipe(PaymentSourceType))
    sourceType: PaymentSourceType,
    @Param('sourceId', ParseUUIDPipe) sourceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentService.getSourceHistory(
      sourceType,
      sourceId,
      user.companyId || '',
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/cancel')
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentService.cancel(id, user.companyId, user.userId);
  }

  @Post('webhook')
  webhook(
    @Body() dto: PaymentWebhookDto,
    @Headers('x-payment-signature') signature?: string,
  ) {
    return this.paymentService.handleWebhook(
      dto.paymentId,
      dto.status,
      signature,
    );
  }
}
