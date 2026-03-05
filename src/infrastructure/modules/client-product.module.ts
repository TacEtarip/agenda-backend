import { Module } from '@nestjs/common';
import { ClientProductService } from '@application/services/client-product.service';
import { ClientProductController } from '../http/controllers/client-product.controller';

@Module({
  controllers: [ClientProductController],
  providers: [ClientProductService],
  exports: [ClientProductService],
})
export class ClientProductModule {}
