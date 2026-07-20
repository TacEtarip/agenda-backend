export class Company {
  yapeEnabled?: boolean;
  yapePhone?: string;
  yapeAccountName?: string;
  yapeQrImageDataUrl?: string;

  constructor(
    public id: string,
    public name: string,
    public createdAt?: Date,
    public updatedAt?: Date,
  ) {}
}
