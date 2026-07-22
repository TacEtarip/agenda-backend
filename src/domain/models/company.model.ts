export class Company {
  yapeEnabled?: boolean;
  yapePhone?: string;
  yapeAccountName?: string;
  yapeQrImageDataUrl?: string;
  culqiEnabled?: boolean;
  culqiPublicKey?: string;
  culqiPrivateKeyEncrypted?: string;

  constructor(
    public id: string,
    public name: string,
    public createdAt?: Date,
    public updatedAt?: Date,
  ) {}
}
