import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnforceUserCompany1784400000000 implements MigrationInterface {
  name = 'EnforceUserCompany1784400000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM "users" WHERE "company_id" IS NULL) THEN
          RAISE EXCEPTION 'Cannot enforce users.company_id: assign or remove orphan users first';
        END IF;
      END
      $$
    `);
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "company_id" SET NOT NULL`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "company_id" DROP NOT NULL`,
    );
  }
}
