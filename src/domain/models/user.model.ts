export class User {
  id!: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  createdAt!: Date;
  passwordHash?: string;
  googleId?: string;
  microsoftId?: string;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
