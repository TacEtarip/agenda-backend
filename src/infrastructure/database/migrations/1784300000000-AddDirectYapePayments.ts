import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDirectYapePayments1784300000000 implements MigrationInterface {
  name = 'AddDirectYapePayments1784300000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "companies" ADD "yape_enabled" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD "yape_phone" varchar(9)`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD "yape_account_name" varchar(120)`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD "yape_qr_image_data_url" text`,
    );
    await queryRunner.query(
      `ALTER TYPE "payments_origin_enum" ADD VALUE IF NOT EXISTS 'DIRECT_YAPE'`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "payments" SET "origin" = 'MANUAL' WHERE "origin" = 'DIRECT_YAPE'`,
    );
    await queryRunner.query(
      `ALTER TYPE "payments_origin_enum" RENAME TO "payments_origin_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "payments_origin_enum" AS ENUM ('PAYMENT_LINK', 'MANUAL')`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "origin" TYPE "payments_origin_enum" USING "origin"::text::"payments_origin_enum"`,
    );
    await queryRunner.query(`DROP TYPE "payments_origin_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "companies" DROP COLUMN "yape_qr_image_data_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" DROP COLUMN "yape_account_name"`,
    );
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "yape_phone"`);
    await queryRunner.query(
      `ALTER TABLE "companies" DROP COLUMN "yape_enabled"`,
    );
  }
}
