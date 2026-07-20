import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentStatusAudit1784500000000 implements MigrationInterface {
  name = 'AddPaymentStatusAudit1784500000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "status_changed_at" timestamp`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "status_changed_by_user_id" uuid`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN "status_changed_by_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN "status_changed_at"`,
    );
  }
}
