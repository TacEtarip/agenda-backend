import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@domain/models/user.model';
import { AuthProviderService } from './auth-provider.service';

describe('AuthProviderService tenant tokens', () => {
  it('does not sign a token for an orphan user', () => {
    const jwt = { sign: jest.fn() } as unknown as JwtService;
    const service = new AuthProviderService(jwt);

    expect(() =>
      service.generateToken(
        new User({ id: 'user-a', email: 'a@example.test' }),
      ),
    ).toThrow(UnauthorizedException);
    expect(jwt.sign).not.toHaveBeenCalled();
  });
});
