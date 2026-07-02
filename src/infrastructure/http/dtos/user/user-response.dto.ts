import { User } from '@domain/models/user.model';

export class UserResponseDto {
  id!: string;
  companyId?: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  phone?: string;
  integrationProvider?: string;
  syncCalendar?: boolean;
  syncContacts?: boolean;
  sendDailyDigest?: boolean;
  paymentEnabled?: boolean;
  createdAt!: Date;

  static fromDomain(user: User): UserResponseDto {
    return {
      id: user.id,
      companyId: user.companyId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      integrationProvider: user.integrationProvider,
      syncCalendar: user.syncCalendar,
      syncContacts: user.syncContacts,
      sendDailyDigest: user.sendDailyDigest,
      paymentEnabled: user.paymentEnabled,
      createdAt: user.createdAt,
    };
  }
}
