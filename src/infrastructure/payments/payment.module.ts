import { Module, Global } from '@nestjs/common';
import { PAYMENT_PROVIDER } from '@domain/ports/payment.provider.interface';
import { CulqiPaymentProviderService } from './culqi-payment.provider.service';
import { PaymentController } from '../http/controllers/payment.controller';
import { PaymentService } from '@application/services/payment.service';
import { YapeQrImageService } from '@application/services/yape-qr-image.service';
import { CulqiConfigurationService } from '@application/services/culqi-configuration.service';
import { PAYMENT_CREDENTIAL_CIPHER } from '@domain/ports/payment-credential-cipher.interface';
import { AesPaymentCredentialCipherService } from './aes-payment-credential-cipher.service';

@Global()
@Module({
  controllers: [PaymentController],
  providers: [
    PaymentService,
    YapeQrImageService,
    CulqiConfigurationService,
    AesPaymentCredentialCipherService,
    {
      provide: PAYMENT_CREDENTIAL_CIPHER,
      useExisting: AesPaymentCredentialCipherService,
    },
    {
      provide: PAYMENT_PROVIDER,
      useClass: CulqiPaymentProviderService,
    },
  ],
  exports: [PAYMENT_PROVIDER, PaymentService, CulqiConfigurationService],
})
export class PaymentModule {}
