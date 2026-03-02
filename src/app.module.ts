import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true, // Automatically loads entities registered via TypeOrmModule.forFeature in feature modules
        synchronize: true, // Only for development/MVP purposes. Disable in prod.
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
