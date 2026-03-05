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
    return ormEntity;
  }
}
