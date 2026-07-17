import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import {
  GoogleIntegration,
  GoogleOAuthState,
} from '@domain/models/google-integration.model';
import { IGoogleIntegrationRepository } from '@domain/ports/google-integration.repository.interface';
import { GoogleIntegrationOrmEntity } from '../entities/google-integration.orm-entity';
import { GoogleOAuthStateOrmEntity } from '../entities/google-oauth-state.orm-entity';

@Injectable()
export class GoogleIntegrationRepository implements IGoogleIntegrationRepository {
  constructor(
    @InjectRepository(GoogleIntegrationOrmEntity)
    private readonly integrations: Repository<GoogleIntegrationOrmEntity>,
    @InjectRepository(GoogleOAuthStateOrmEntity)
    private readonly states: Repository<GoogleOAuthStateOrmEntity>,
  ) {}

  async findByUserId(userId: string): Promise<GoogleIntegration | null> {
    const entity = await this.integrations.findOne({ where: { userId } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByGoogleSubject(
    googleSubject: string,
  ): Promise<GoogleIntegration | null> {
    const entity = await this.integrations.findOne({
      where: { googleSubject },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async upsert(
    integration: Partial<GoogleIntegration> &
      Pick<
        GoogleIntegration,
        'userId' | 'companyId' | 'googleSubject' | 'email'
      >,
  ): Promise<GoogleIntegration> {
    const existing = await this.integrations.findOne({
      where: { userId: integration.userId },
    });
    const entity = this.integrations.create({
      ...existing,
      ...integration,
      refreshTokenEncrypted:
        integration.refreshTokenEncrypted ??
        existing?.refreshTokenEncrypted ??
        null,
      expiresAt: integration.expiresAt ?? null,
    });
    return this.toDomain(await this.integrations.save(entity));
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.integrations.delete({ userId });
  }

  async createState(stateHash: string, state: GoogleOAuthState): Promise<void> {
    await this.states.delete({ expiresAt: LessThan(new Date()) });
    await this.states.delete({ userId: state.userId });
    await this.states.save(this.states.create({ stateHash, ...state }));
  }

  async consumeState(stateHash: string): Promise<GoogleOAuthState | null> {
    const result = await this.states
      .createQueryBuilder()
      .delete()
      .where('state_hash = :stateHash', { stateHash })
      .returning(['user_id', 'company_id', 'expires_at'])
      .execute();
    const state = result.raw[0] as
      | { user_id: string; company_id: string; expires_at: Date | string }
      | undefined;
    if (!state) return null;
    return {
      userId: state.user_id,
      companyId: state.company_id,
      expiresAt: new Date(state.expires_at),
    };
  }

  private toDomain(entity: GoogleIntegrationOrmEntity): GoogleIntegration {
    return new GoogleIntegration({
      id: entity.id,
      userId: entity.userId,
      companyId: entity.companyId,
      googleSubject: entity.googleSubject,
      email: entity.email,
      accessTokenEncrypted: entity.accessTokenEncrypted,
      refreshTokenEncrypted: entity.refreshTokenEncrypted ?? undefined,
      scope: entity.scope,
      tokenType: entity.tokenType,
      expiresAt: entity.expiresAt ?? undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
