import { User } from '@domain/models/user.model';
import { UserOrmEntity } from '../entities/user.orm-entity';

export class UserMapper {
  static toDomain(ormEntity: UserOrmEntity): User {
    return new User({
      id: ormEntity.id,
      email: ormEntity.email,
      firstName: ormEntity.firstName,
      lastName: ormEntity.lastName,
      passwordHash: ormEntity.passwordHash,
      googleId: ormEntity.googleId,
      microsoftId: ormEntity.microsoftId,
      integrationProvider: ormEntity.integrationProvider,
      syncCalendar: ormEntity.syncCalendar,
      syncContacts: ormEntity.syncContacts,
      sendDailyDigest: ormEntity.sendDailyDigest,
      paymentEnabled: ormEntity.paymentEnabled,
      paymentGatewayKey: ormEntity.paymentGatewayKey,
      createdAt: ormEntity.createdAt,
    });
  }

  static toOrmEntity(domainUser: Partial<User>): UserOrmEntity {
    const ormEntity = new UserOrmEntity();
    if (domainUser.id) ormEntity.id = domainUser.id;
    if (domainUser.email) ormEntity.email = domainUser.email;
    if (domainUser.firstName) ormEntity.firstName = domainUser.firstName;
    if (domainUser.lastName) ormEntity.lastName = domainUser.lastName;
    if (domainUser.passwordHash !== undefined)
      ormEntity.passwordHash = domainUser.passwordHash;
    if (domainUser.googleId !== undefined)
      ormEntity.googleId = domainUser.googleId;
    if (domainUser.microsoftId !== undefined)
      ormEntity.microsoftId = domainUser.microsoftId;
      
    if (domainUser.integrationProvider !== undefined)
      ormEntity.integrationProvider = domainUser.integrationProvider;
    if (domainUser.syncCalendar !== undefined)
      ormEntity.syncCalendar = domainUser.syncCalendar;
    if (domainUser.syncContacts !== undefined)
      ormEntity.syncContacts = domainUser.syncContacts;
    if (domainUser.sendDailyDigest !== undefined)
      ormEntity.sendDailyDigest = domainUser.sendDailyDigest;
    if (domainUser.paymentEnabled !== undefined)
      ormEntity.paymentEnabled = domainUser.paymentEnabled;
    if (domainUser.paymentGatewayKey !== undefined)
      ormEntity.paymentGatewayKey = domainUser.paymentGatewayKey;

    return ormEntity;
  }
}
