export class Note {
  id!: string;
  clientId!: string;
  content!: string;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<Note>) {
    Object.assign(this, partial);
  }
}
