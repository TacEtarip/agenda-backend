import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExpiredAppointmentStatus1783900000000 implements MigrationInterface {
  name = 'AddExpiredAppointmentStatus1783900000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "appointments_status_enum" ADD VALUE IF NOT EXISTS 'expired'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_appointments_scheduled_end_time" ON "appointments" ("end_time") WHERE "status" = 'scheduled' AND "deleted_at" IS NULL`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_appointments_scheduled_end_time"`,
    );
    await queryRunner.query(
      `UPDATE "appointments" SET "status" = 'cancelled' WHERE "status" = 'expired'`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TYPE "appointments_status_enum" RENAME TO "appointments_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "appointments_status_enum" AS ENUM ('scheduled', 'completed', 'cancelled')`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ALTER COLUMN "status" TYPE "appointments_status_enum" USING "status"::text::"appointments_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ALTER COLUMN "status" SET DEFAULT 'scheduled'`,
    );
    await queryRunner.query(`DROP TYPE "appointments_status_enum_old"`);
  }
}
