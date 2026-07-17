import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoogleCalendarSync1783800000000 implements MigrationInterface {
  name = 'AddGoogleCalendarSync1783800000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "appointments_calendar_sync_status_enum" AS ENUM ('not_synced', 'pending', 'synced', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TYPE "appointments_calendar_sync_operation_enum" AS ENUM ('upsert', 'delete')`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ALTER COLUMN "start_time" TYPE TIMESTAMP WITH TIME ZONE USING "start_time" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ALTER COLUMN "end_time" TYPE TIMESTAMP WITH TIME ZONE USING "end_time" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD "external_calendar_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD "calendar_sync_status" "appointments_calendar_sync_status_enum" NOT NULL DEFAULT 'not_synced'`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD "calendar_sync_operation" "appointments_calendar_sync_operation_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD "calendar_sync_error" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD "calendar_sync_attempts" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD "calendar_sync_next_attempt_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD "calendar_synced_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_appointments_calendar_sync_due" ON "appointments" ("calendar_sync_status", "calendar_sync_next_attempt_at")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_appointments_calendar_sync_due"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP COLUMN "deleted_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP COLUMN "calendar_synced_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP COLUMN "calendar_sync_next_attempt_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP COLUMN "calendar_sync_attempts"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP COLUMN "calendar_sync_error"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP COLUMN "calendar_sync_operation"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP COLUMN "calendar_sync_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP COLUMN "external_calendar_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ALTER COLUMN "end_time" TYPE TIMESTAMP WITHOUT TIME ZONE USING "end_time" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ALTER COLUMN "start_time" TYPE TIMESTAMP WITHOUT TIME ZONE USING "start_time" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `DROP TYPE "appointments_calendar_sync_operation_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "appointments_calendar_sync_status_enum"`,
    );
  }
}
