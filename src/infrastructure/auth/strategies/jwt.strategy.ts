import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string;
  email: string;
  companyId: string;
  companyName?: string;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  companyId: string;
  companyName?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    if (!payload.sub || !payload.email || !payload.companyId) {
      throw new UnauthorizedException('Invalid tenant session');
    }
    return {
      userId: payload.sub,
      email: payload.email,
      companyId: payload.companyId,
      companyName: payload.companyName,
    };
  }
}
