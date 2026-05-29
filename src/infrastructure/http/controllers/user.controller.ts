import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Request,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from '@application/services/user.service';
import { CreateUserDto } from '../dtos/user/create-user.dto';
import { UpdateUserSettingsDto } from '../dtos/user/update-user-settings.dto';
import { JwtAuthGuard } from '@infrastructure/auth/guards/jwt-auth.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.createUser(createUserDto);
    // Ideally we don't expose password hashes or sensitive info directly down the line.
    return {
      message: 'User created successfully',
      user,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.userService.getUser(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/settings')
  async updateSettings(
    @Request() req: Express.Request & { user: { userId: string } },
    @Body() updateSettingsDto: UpdateUserSettingsDto,
  ) {
    const user = await this.userService.updateUserSettings(
      req.user.userId,
      updateSettingsDto,
    );
    return {
      message: 'Settings updated successfully',
      settings: {
        integrationProvider: user.integrationProvider,
        syncCalendar: user.syncCalendar,
        syncContacts: user.syncContacts,
        sendDailyDigest: user.sendDailyDigest,
        paymentEnabled: user.paymentEnabled,
        paymentGatewayKey: user.paymentGatewayKey,
      },
    };
  }
}
