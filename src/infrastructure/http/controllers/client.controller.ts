import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { ClientService } from '@application/services/client.service';
import { CreateClientDto } from '../dtos/client/create-client.dto';
import { JwtAuthGuard } from '@infrastructure/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@infrastructure/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@infrastructure/auth/strategies/jwt.strategy';

@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  async create(
    @Body() createClientDto: CreateClientDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // Inyectamos el tenant al DTO/Entity antes de pasarlo al service
    const clientData = {
      ...createClientDto,
      userId: user.userId,
      companyId: user.companyId,
    };
    const client = await this.clientService.createClient(clientData);
    return {
      message: 'Client created successfully',
      client,
    };
  }

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    if (!user.companyId) return [];
    return this.clientService.getClientsByCompany(user.companyId);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const client = await this.clientService.getClient(id, user.companyId || '');
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    return client;
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateData: Partial<CreateClientDto>, // In a real app we'd use an UpdateClientDto
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const updatedClient = await this.clientService.updateClient(
      id,
      updateData,
      user.companyId || '',
    );
    return {
      message: 'Client updated successfully',
      client: updatedClient,
    };
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.clientService.deleteClient(id, user.companyId || '');
    return {
      message: 'Client deleted successfully',
    };
  }
}
