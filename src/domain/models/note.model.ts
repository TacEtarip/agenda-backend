export class Note {
  id!: string;
  companyId?: string;
  clientId!: string;
  content!: string;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<Note>) {
    Object.assign(this, partial);
  }
}
