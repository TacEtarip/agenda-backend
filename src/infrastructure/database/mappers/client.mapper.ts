import { Client } from '@domain/models/client.model';
import { ClientOrmEntity } from '../entities/client.orm-entity';

export class ClientMapper {
  static toDomain(ormEntity: ClientOrmEntity): Client {
    return new Client({
      id: ormEntity.id,
      companyId: ormEntity.companyId,
      userId: ormEntity.userId,
      firstName: ormEntity.firstName,
      lastName: ormEntity.lastName,
      phoneNumber: ormEntity.phoneNumber,
      email: ormEntity.email,
      stage: ormEntity.stage,
      createdAt: ormEntity.createdAt,
    });
  }

  static toOrmEntity(domainClient: Partial<Client>): ClientOrmEntity {
    const ormEntity = new ClientOrmEntity();
    if (domainClient.id) ormEntity.id = domainClient.id;
    if (domainClient.companyId !== undefined)
      ormEntity.companyId = domainClient.companyId!;
    if (domainClient.userId) ormEntity.userId = domainClient.userId;
    if (domainClient.firstName) ormEntity.firstName = domainClient.firstName;
    if (domainClient.lastName) ormEntity.lastName = domainClient.lastName;
    if (domainClient.phoneNumber)
      ormEntity.phoneNumber = domainClient.phoneNumber;
    if (domainClient.email !== undefined) ormEntity.email = domainClient.email;
    if (domainClient.stage) ormEntity.stage = domainClient.stage;
    return ormEntity;
  }
}
