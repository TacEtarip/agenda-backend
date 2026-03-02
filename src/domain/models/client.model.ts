export enum ClientStage {
  FIRST_CONTACT = 'FIRST_CONTACT',
  FOLLOW_UP = 'FOLLOW_UP',
  CLOSED_SALE = 'CLOSED_SALE',
  MAINTENANCE = 'MAINTENANCE',
  POST_SALE = 'POST_SALE',
}

export class Client {
  id!: string;
  userId!: string;
  firstName!: string;
  lastName!: string;
  phoneNumber!: string;
  stage!: ClientStage;
  createdAt!: Date;
  email?: string;

  constructor(partial: Partial<Client>) {
    Object.assign(this, partial);
  }
}
