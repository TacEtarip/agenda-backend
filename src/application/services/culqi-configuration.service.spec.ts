import { BadRequestException } from '@nestjs/common';
import type { IPaymentCredentialCipher } from '@domain/ports/payment-credential-cipher.interface';
import { CulqiConfigurationService } from './culqi-configuration.service';

describe('CulqiConfigurationService', () => {
  const setup = () => {
    let company = {
      id: 'company-1',
      name: 'Comercio',
      culqiEnabled: false,
      culqiPublicKey: undefined as string | undefined,
      culqiPrivateKeyEncrypted: undefined as string | undefined,
    };
    const companies = {
      findById: jest.fn(async () => company),
      update: jest.fn(async (_id: string, changes: typeof company) => {
        company = { ...company, ...changes };
        return company;
      }),
    };
    const cipher = {
      isConfigured: jest.fn().mockReturnValue(true),
      encrypt: jest.fn((value: string) => `encrypted:${value}`),
      decrypt: jest.fn((value: string) => value.replace('encrypted:', '')),
    } as unknown as jest.Mocked<IPaymentCredentialCipher>;
    const service = new CulqiConfigurationService(companies as never, cipher);
    return { service, companies, cipher };
  };

  it('stores the private key encrypted for the owning company', async () => {
    const { service, companies, cipher } = setup();

    const result = await service.updateConfiguration('company-1', {
      enabled: true,
      publicKey: 'pk_test_public',
      privateKey: 'sk_test_private',
    });

    expect(cipher.encrypt).toHaveBeenCalledWith(
      'sk_test_private',
      'culqi:company-1:private-key',
    );
    expect(companies.update).toHaveBeenCalledWith(
      'company-1',
      expect.objectContaining({
        culqiEnabled: true,
        culqiPublicKey: 'pk_test_public',
        culqiPrivateKeyEncrypted: 'encrypted:sk_test_private',
      }),
    );
    expect(result.privateKeyConfigured).toBe(true);
  });

  it('never returns the decrypted private key in public configuration', async () => {
    const { service } = setup();
    await service.updateConfiguration('company-1', {
      enabled: true,
      publicKey: 'pk_test_public',
      privateKey: 'sk_test_private',
    });

    const result = await service.getConfiguration('company-1');

    expect(result).not.toHaveProperty('privateKey');
    expect(result.privateKeyConfigured).toBe(true);
  });

  it('rejects keys from different Culqi environments', async () => {
    const { service } = setup();

    await expect(
      service.updateConfiguration('company-1', {
        enabled: true,
        publicKey: 'pk_live_public',
        privateKey: 'sk_test_private',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
