import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompanyCulqiCredentials1784600000000 implements MigrationInterface {
  name = 'AddCompanyCulqiCredentials1784600000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "companies" ADD "culqi_enabled" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD "culqi_public_key" varchar(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD "culqi_private_key_encrypted" text`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "companies" DROP COLUMN "culqi_private_key_encrypted"`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" DROP COLUMN "culqi_public_key"`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" DROP COLUMN "culqi_enabled"`,
    );
  }
}
