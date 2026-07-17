import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoogleCalendarInboundSync1784000000000 implements MigrationInterface {
  name = 'AddGoogleCalendarInboundSync1784000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "google_integrations" ADD "calendar_id" character varying NOT NULL DEFAULT 'primary'`,
    );
    await queryRunner.query(
      `ALTER TABLE "google_integrations" ADD "calendar_sync_token" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "google_integrations" ADD "webhook_channel_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "google_integrations" ADD "webhook_resource_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "google_integrations" ADD "webhook_token_hash" character(64)`,
    );
    await queryRunner.query(
      `ALTER TABLE "google_integrations" ADD "webhook_expires_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "google_integrations" ADD "inbound_synced_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "google_integrations" ADD "inbound_sync_error" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "google_integrations" ADD CONSTRAINT "UQ_google_integrations_webhook_channel" UNIQUE ("webhook_channel_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_appointments_external_calendar_event" ON "appointments" ("user_id", "external_calendar_id", "external_event_id") WHERE "external_event_id" IS NOT NULL`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_appointments_external_calendar_event"`,
    );
    await queryRunner.query(
      `ALTER TABLE "google_integrations" DROP CONSTRAINT IF EXISTS "UQ_google_integrations_webhook_channel"`,
    );
    for (const column of [
      'inbound_sync_error',
      'inbound_synced_at',
      'webhook_expires_at',
      'webhook_token_hash',
      'webhook_resource_id',
      'webhook_channel_id',
      'calendar_sync_token',
      'calendar_id',
    ]) {
      await queryRunner.query(
        `ALTER TABLE "google_integrations" DROP COLUMN "${column}"`,
      );
    }
  }
}
