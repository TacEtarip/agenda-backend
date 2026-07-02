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
  ParseUUIDPipe,
} from '@nestjs/common';
import { UserService } from '@application/services/user.service';
import { CreateUserDto } from '../dtos/user/create-user.dto';
import { UpdateUserSettingsDto } from '../dtos/user/update-user-settings.dto';
import { JwtAuthGuard } from '@infrastructure/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@infrastructure/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@infrastructure/auth/strategies/jwt.strategy';
import { UserResponseDto } from '../dtos/user/user-response.dto';
import { UpdateUserProfileDto } from '../dtos/user/update-user-profile.dto';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    const user = await this.userService.createUser({
      ...createUserDto,
      companyId: currentUser.companyId,
    });
    return {
      message: 'User created successfully',
      user: UserResponseDto.fromDomain(user),
    };
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    const user = await this.userService.getUser(id, currentUser.companyId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return UserResponseDto.fromDomain(user);
  }

  @Patch('me/settings')
  async updateSettings(
    @Request() req: Express.Request & { user: AuthenticatedUser },
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
      },
    };
  }

  @Patch('me/profile')
  async updateProfile(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
  ) {
    const user = await this.userService.updateUserProfile(
      currentUser.userId,
      updateUserProfileDto,
    );
    return UserResponseDto.fromDomain(user);
  }
}
