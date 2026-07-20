import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '@application/services/auth.service';
import { LoginDto } from '../dtos/auth/login.dto';
import { RegisterCompanyDto } from '../dtos/auth/register-company.dto';
import { JwtAuthGuard } from '@infrastructure/auth/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register-company')
  registerCompany(@Body() dto: RegisterCompanyDto) {
    return this.authService.registerCompany(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(
    @Request()
    req: Express.Request & { user: { userId: string; email: string } },
  ) {
    return req.user;
  }
}
