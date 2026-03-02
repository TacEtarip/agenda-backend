import { Module } from '@nestjs/common';
import { ClientService } from '@application/services/client.service';
import { ClientController } from '../http/controllers/client.controller';

@Module({
  controllers: [ClientController],
  providers: [ClientService],
  exports: [ClientService],
})
export class ClientModule {}
