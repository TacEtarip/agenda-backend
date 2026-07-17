import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoogleIntegration1783700000000 implements MigrationInterface {
  name = 'AddGoogleIntegration1783700000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "google_integrations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "company_id" uuid NOT NULL,
        "google_subject" character varying NOT NULL,
        "email" character varying NOT NULL,
        "access_token_encrypted" text NOT NULL,
        "refresh_token_encrypted" text,
        "scope" text NOT NULL,
        "token_type" character varying NOT NULL DEFAULT 'Bearer',
        "expires_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_google_integrations" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_google_integrations_user" UNIQUE ("user_id"),
        CONSTRAINT "UQ_google_integrations_subject" UNIQUE ("google_subject"),
        CONSTRAINT "FK_google_integrations_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_google_integrations_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_google_integrations_company" ON "google_integrations" ("company_id")',
    );

    await queryRunner.query(`
      CREATE TABLE "google_oauth_states" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "state_hash" character(64) NOT NULL,
        "user_id" uuid NOT NULL,
        "company_id" uuid NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_google_oauth_states" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_google_oauth_states_hash" UNIQUE ("state_hash"),
        CONSTRAINT "FK_google_oauth_states_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_google_oauth_states_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_google_oauth_states_expires_at" ON "google_oauth_states" ("expires_at")',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_google_oauth_states_expires_at"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS "google_oauth_states"');
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_google_integrations_company"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS "google_integrations"');
  }
}
