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
} from '@nestjs/common';
import { ClientService } from '@application/services/client.service';
import { CreateClientDto } from '../dtos/client/create-client.dto';

@Controller('clients')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  async create(@Body() createClientDto: CreateClientDto) {
    const client = await this.clientService.createClient(createClientDto);
    return {
      message: 'Client created successfully',
      client,
    };
  }

  @Get('user/:userId')
  async findAllByUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.clientService.getClientsByUser(userId);
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
