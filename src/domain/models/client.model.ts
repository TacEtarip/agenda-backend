import { ClientStage } from '../enums/client-stage.enum';

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
