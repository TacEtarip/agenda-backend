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
import type { JwtPayload } from '@infrastructure/auth/strategies/jwt.strategy';

@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  async create(
    @Body() createClientDto: CreateClientDto,
    @CurrentUser() user: JwtPayload,
  ) {
    // Inyectamos el tenant al DTO/Entity antes de pasarlo al service
    const clientData = {
      ...createClientDto,
      userId: user.sub, // Keep for backward compatibility or replace
      companyId: user.companyId,
    };
    const client = await this.clientService.createClient(clientData);
    return {
      message: 'Client created successfully',
      client,
    };
  }

  @Get()
  async findAll(@CurrentUser() user: JwtPayload) {
    if (!user.companyId) return [];
    return this.clientService.getClientsByCompany(user.companyId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const client = await this.clientService.getClient(id);
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    return client;
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateData: Partial<CreateClientDto>, // In a real app we'd use an UpdateClientDto
  ) {
    const updatedClient = await this.clientService.updateClient(id, updateData);
    return {
      message: 'Client updated successfully',
      client: updatedClient,
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.clientService.deleteClient(id);
    return {
      message: 'Client deleted successfully',
    };
  }
}
