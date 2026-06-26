import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CLIENT_REPOSITORY } from '@domain/ports/client.repository.interface';
import type { IClientRepository } from '@domain/ports/client.repository.interface';
import { USER_REPOSITORY } from '@domain/ports/user.repository.interface';
import type { IUserRepository } from '@domain/ports/user.repository.interface';
import { Client } from '@domain/models/client.model';

@Injectable()
export class ClientService {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: IClientRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async createClient(data: Partial<Client>): Promise<Client> {
    if (!data.userId) {
      throw new Error('User ID is required to create a client');
    }
    if (!data.companyId) {
      throw new Error('Company ID is required to create a client');
    }

    // Verify if the associated professional (user) exists
    const user = await this.userRepository.findById(data.userId);
    if (!user || user.companyId !== data.companyId) {
      throw new NotFoundException('User not found');
    }

    return this.clientRepository.create(data);
  }

  async getClient(id: string, companyId: string): Promise<Client | null> {
    const client = await this.clientRepository.findById(id);
    if (!client || client.companyId !== companyId) return null;
    return client;
  }

  async getClientsByUser(userId: string): Promise<Client[]> {
    return await this.clientRepository.findAllByUserId(userId);
  }

  async getClientsByCompany(companyId: string): Promise<Client[]> {
    return await this.clientRepository.findAllByCompanyId(companyId);
  }

  async updateClient(
    id: string,
    data: Partial<Client>,
    companyId: string,
  ): Promise<Client> {
    const existingClient = await this.clientRepository.findById(id);
    if (!existingClient || existingClient.companyId !== companyId) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    return this.clientRepository.update(id, { ...data, companyId });
  }

  async deleteClient(id: string, companyId: string): Promise<void> {
    const existingClient = await this.clientRepository.findById(id);
    if (!existingClient || existingClient.companyId !== companyId) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    await this.clientRepository.delete(id);
  }
}
