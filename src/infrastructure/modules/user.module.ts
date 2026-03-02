import { Module } from '@nestjs/common';
import { UserService } from '@application/services/user.service';
import { UserController } from '../http/controllers/user.controller';

@Module({
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService], // Exporting so the AuthModule can use it later
})
export class UserModule {}
