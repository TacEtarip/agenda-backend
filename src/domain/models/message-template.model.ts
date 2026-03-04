import { ClientStage } from '../enums/client-stage.enum';

export class MessageTemplate {
  id!: string;
  userId!: string;
  stage!: ClientStage;
  messageBody!: string;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<MessageTemplate>) {
    Object.assign(this, partial);
  }
}
