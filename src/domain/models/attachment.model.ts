export class Attachment {
  id!: string;
  companyId?: string;
  clientId!: string;
  fileName!: string;
  fileUrl!: string;
  uploadedAt!: Date;
  fileType?: string;
  noteId?: string;

  constructor(partial: Partial<Attachment>) {
    Object.assign(this, partial);
  }
}
