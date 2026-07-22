export class User {
  id!: string;
  companyId!: string;
  companyName?: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  phone?: string;
  createdAt!: Date;
  passwordHash?: string;
  googleId?: string | null;
  microsoftId?: string | null;

  // Settings
  integrationProvider?: string;
  syncCalendar?: boolean;
  syncContacts?: boolean;
  sendDailyDigest?: boolean;
  paymentEnabled?: boolean;
  paymentGatewayKey?: string;
  onboardingCompleted?: boolean;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
