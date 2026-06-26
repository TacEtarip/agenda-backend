import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './infrastructure/database/database.module';
import { UserModule } from './infrastructure/modules/user.module';
import { ClientModule } from '@infrastructure/modules/client.module';
import { AuthModule } from '@infrastructure/modules/auth.module';
import { NoteModule } from '@infrastructure/modules/note.module';
import { AppointmentModule } from '@infrastructure/modules/appointment.module';
import { AttachmentModule } from '@infrastructure/modules/attachment.module';
import { MessageTemplateModule } from '@infrastructure/modules/message-template.module';
import { ProductModule } from '@infrastructure/modules/product.module';
import { ClientProductModule } from '@infrastructure/modules/client-product.module';
import { MessagingModule } from '@infrastructure/messaging/messaging.module';
import { PaymentModule } from '@infrastructure/payments/payment.module';
import { validateEnv } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow<string>('DB_HOST'),
        port: Number(configService.getOrThrow<string>('DB_PORT')),
        username: configService.getOrThrow<string>('DB_USER'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        database: configService.getOrThrow<string>('DB_NAME'),
        autoLoadEntities: true, // Automatically loads entities registered via TypeOrmModule.forFeature in feature modules
        synchronize: configService.get<string>('TYPEORM_SYNC') === 'true',
      }),
    }),
    DatabaseModule, // Injects all domain repository providers
    UserModule, // Feature module for our user logic & API
    ClientModule, // Feature module for our client logic & API
    AuthModule, // JWT authentication
    NoteModule,
    AppointmentModule,
    AttachmentModule,
    MessageTemplateModule,
    ProductModule,
    ClientProductModule,
    MessagingModule, // Integra el proveedor de WhatsAppWeb
    PaymentModule, // Integra la pasarela de pagos local (Culqi/Niubiz/MercadoPago)
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
