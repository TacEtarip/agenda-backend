import {
  GoogleIntegration,
  GoogleOAuthState,
} from '../models/google-integration.model';

export const GOOGLE_INTEGRATION_REPOSITORY = 'GOOGLE_INTEGRATION_REPOSITORY';

export interface IGoogleIntegrationRepository {
  findByUserId(userId: string): Promise<GoogleIntegration | null>;
  findByGoogleSubject(googleSubject: string): Promise<GoogleIntegration | null>;
  upsert(
    integration: Partial<GoogleIntegration> &
      Pick<
        GoogleIntegration,
        'userId' | 'companyId' | 'googleSubject' | 'email'
      >,
  ): Promise<GoogleIntegration>;
  deleteByUserId(userId: string): Promise<void>;
  createState(stateHash: string, state: GoogleOAuthState): Promise<void>;
  consumeState(stateHash: string): Promise<GoogleOAuthState | null>;
}
