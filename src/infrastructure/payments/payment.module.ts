import { Module, Global } from '@nestjs/common';
import { PAYMENT_PROVIDER } from '@domain/ports/payment.provider.interface';
import { CulqiPaymentProviderService } from './culqi-payment.provider.service';
import { PaymentController } from '../http/controllers/payment.controller';

@Global()
@Module({
  controllers: [PaymentController],
  providers: [
    {
      provide: PAYMENT_PROVIDER,
      useClass: CulqiPaymentProviderService,
    },
  ],
  exports: [PAYMENT_PROVIDER],
})
export class PaymentModule {}
