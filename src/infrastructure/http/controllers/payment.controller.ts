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

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @UseGuards(JwtAuthGuard)
  @Post('links')
  createLink(@Body() dto: CreatePaymentLinkDto, @CurrentUser() user: AuthenticatedUser) {
    return this.paymentService.createLink(dto, user.companyId || '');
  }

  @UseGuards(JwtAuthGuard)
  @Post('manual')
  registerManual(@Body() dto: RegisterManualPaymentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.paymentService.registerManual(dto, user.companyId || '');
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  list(@Query() query: ListPaymentsQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.paymentService.list(query, user.companyId || '');
  }

  @UseGuards(JwtAuthGuard)
  @Get('source/:sourceType/:sourceId')
  sourceHistory(
    @Param('sourceType', new ParseEnumPipe(PaymentSourceType)) sourceType: PaymentSourceType,
    @Param('sourceId', ParseUUIDPipe) sourceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentService.getSourceHistory(sourceType, sourceId, user.companyId || '');
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/cancel')
  cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.paymentService.cancel(id, user.companyId || '');
  }

  @Post('webhook')
  webhook(
    @Body() dto: PaymentWebhookDto,
    @Headers('x-payment-signature') signature?: string,
  ) {
    return this.paymentService.handleWebhook(dto.paymentId, dto.status, signature);
  }
}
