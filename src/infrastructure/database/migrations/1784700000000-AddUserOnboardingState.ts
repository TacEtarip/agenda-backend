import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserOnboardingState1784700000000 implements MigrationInterface {
  name = 'AddUserOnboardingState1784700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Existing accounts should not be interrupted. The initial true default
    // fills those rows, then new accounts inherit the final false default.
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "onboarding_completed" boolean NOT NULL DEFAULT true
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "onboarding_completed" SET DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "onboarding_completed"
    `);
  }
}
