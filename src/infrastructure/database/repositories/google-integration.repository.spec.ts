import type { Repository } from 'typeorm';
import { GoogleIntegrationOrmEntity } from '../entities/google-integration.orm-entity';
import { GoogleOAuthStateOrmEntity } from '../entities/google-oauth-state.orm-entity';
import { GoogleIntegrationRepository } from './google-integration.repository';

describe('GoogleIntegrationRepository', () => {
  it('atomically consumes an OAuth state using entity property names', async () => {
    const execute = jest.fn().mockResolvedValue({
      raw: [
        {
          user_id: 'user-1',
          company_id: 'company-1',
          expires_at: '2026-07-17T16:23:03.395Z',
        },
      ],
    });
    const queryBuilder = {
      delete: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      execute,
    };
    const states = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    } as unknown as Repository<GoogleOAuthStateOrmEntity>;
    const integrations = {} as Repository<GoogleIntegrationOrmEntity>;
    const repository = new GoogleIntegrationRepository(integrations, states);

    const result = await repository.consumeState('state-hash');

    expect(queryBuilder.returning).toHaveBeenCalledWith([
      'userId',
      'companyId',
      'expiresAt',
    ]);
    expect(result).toEqual({
      userId: 'user-1',
      companyId: 'company-1',
      expiresAt: new Date('2026-07-17T16:23:03.395Z'),
    });
  });
});
