import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from '@application/services/auth.service';
import { AuthController } from '../http/controllers/auth.controller';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { AuthProviderService } from '../auth/auth-provider.service';
import { AUTH_PROVIDER } from '@domain/ports/auth.provider.interface';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>(
            'JWT_EXPIRATION',
            '7d',
          ) as `${number}d`,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: AUTH_PROVIDER,
      useClass: AuthProviderService,
    },
  ],
})
export class AuthModule {}
