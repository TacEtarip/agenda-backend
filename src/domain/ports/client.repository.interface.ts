import { Client } from '../models/client.model';

export const CLIENT_REPOSITORY = 'CLIENT_REPOSITORY';

export interface IClientRepository {
  create(client: Partial<Client>): Promise<Client>;
  findById(id: string): Promise<Client | null>;
  findAllByUserId(userId: string): Promise<Client[]>;
  update(id: string, client: Partial<Client>): Promise<Client>;
  delete(id: string): Promise<void>;
}
