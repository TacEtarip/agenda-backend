import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { COMPANY_REPOSITORY } from '@domain/ports/company.repository.interface';
import type { ICompanyRepository } from '@domain/ports/company.repository.interface';
import {
  PAYMENT_CREDENTIAL_CIPHER,
  type IPaymentCredentialCipher,
} from '@domain/ports/payment-credential-cipher.interface';
import type { PaymentProviderCredentials } from '@domain/ports/payment.provider.interface';

export type CulqiEnvironment = 'test' | 'live';

export interface CulqiConfiguration {
  enabled: boolean;
  publicKey?: string;
  privateKeyConfigured: boolean;
  encryptionReady: boolean;
  environment?: CulqiEnvironment;
}

export interface UpdateCulqiConfigurationInput {
  enabled: boolean;
  publicKey?: string;
  privateKey?: string;
  clearPrivateKey?: boolean;
}

@Injectable()
export class CulqiConfigurationService {
  constructor(
    @Inject(COMPANY_REPOSITORY)
    private readonly companies: ICompanyRepository,
    @Inject(PAYMENT_CREDENTIAL_CIPHER)
    private readonly cipher: IPaymentCredentialCipher,
  ) {}

  async getConfiguration(companyId: string): Promise<CulqiConfiguration> {
    const company = await this.companies.findById(companyId);
    if (!company) throw new NotFoundException('Company not found');
    return {
      enabled: company.culqiEnabled ?? false,
      publicKey: company.culqiPublicKey,
      privateKeyConfigured: Boolean(company.culqiPrivateKeyEncrypted),
      encryptionReady: this.cipher.isConfigured(),
      environment: this.environmentFromKey(company.culqiPublicKey),
    };
  }

  async updateConfiguration(
    companyId: string,
    input: UpdateCulqiConfigurationInput,
  ): Promise<CulqiConfiguration> {
    const company = await this.companies.findById(companyId);
    if (!company) throw new NotFoundException('Company not found');

    const publicKey = input.publicKey?.trim() ?? company.culqiPublicKey ?? '';
    const privateKey = input.privateKey?.trim();
    let privateKeyEncrypted = input.clearPrivateKey
      ? ''
      : (company.culqiPrivateKeyEncrypted ?? '');

    if (privateKey) {
      if (!this.cipher.isConfigured()) {
        throw new BadRequestException(
          'Payment credential encryption is not configured on the server',
        );
      }
      this.assertMatchingEnvironments(publicKey, privateKey);
      privateKeyEncrypted = this.cipher.encrypt(
        privateKey,
        this.credentialContext(companyId),
      );
    }

    if (input.enabled) {
      if (!this.cipher.isConfigured()) {
        throw new BadRequestException(
          'Payment credential encryption is not configured on the server',
        );
      }
      if (!publicKey || !privateKeyEncrypted) {
        throw new BadRequestException(
          'Culqi public and private keys are required before enabling the integration',
        );
      }
      if (!this.environmentFromKey(publicKey)) {
        throw new BadRequestException('Invalid Culqi public key');
      }
      const resolvedPrivateKey = privateKey
        ? privateKey
        : this.cipher.decrypt(
            privateKeyEncrypted,
            this.credentialContext(companyId),
          );
      this.assertMatchingEnvironments(publicKey, resolvedPrivateKey);
    }

    const updated = await this.companies.update(companyId, {
      culqiEnabled: input.enabled,
      culqiPublicKey: publicKey,
      culqiPrivateKeyEncrypted: privateKeyEncrypted,
    });
    return {
      enabled: updated.culqiEnabled ?? false,
      publicKey: updated.culqiPublicKey,
      privateKeyConfigured: Boolean(updated.culqiPrivateKeyEncrypted),
      encryptionReady: this.cipher.isConfigured(),
      environment: this.environmentFromKey(updated.culqiPublicKey),
    };
  }

  async getCredentials(companyId: string): Promise<PaymentProviderCredentials> {
    const company = await this.companies.findById(companyId);
    if (!company) throw new NotFoundException('Company not found');
    if (
      !company.culqiEnabled ||
      !company.culqiPublicKey ||
      !company.culqiPrivateKeyEncrypted ||
      !this.cipher.isConfigured()
    ) {
      throw new BadRequestException('Culqi is not configured for this company');
    }
    const privateKey = this.cipher.decrypt(
      company.culqiPrivateKeyEncrypted,
      this.credentialContext(companyId),
    );
    this.assertMatchingEnvironments(company.culqiPublicKey, privateKey);
    return { publicKey: company.culqiPublicKey, privateKey };
  }

  private credentialContext(companyId: string): string {
    return `culqi:${companyId}:private-key`;
  }

  private environmentFromKey(key?: string): CulqiEnvironment | undefined {
    const match = key?.match(/^pk_(test|live)_.+$/);
    return match?.[1] as CulqiEnvironment | undefined;
  }

  private assertMatchingEnvironments(publicKey: string, privateKey: string) {
    const publicEnvironment = this.environmentFromKey(publicKey);
    const privateEnvironment = privateKey.match(/^sk_(test|live)_.+$/)?.[1];
    if (!publicEnvironment || !privateEnvironment) {
      throw new BadRequestException('Invalid Culqi integration keys');
    }
    if (publicEnvironment !== privateEnvironment) {
      throw new BadRequestException(
        'Culqi public and private keys must belong to the same environment',
      );
    }
  }
}
