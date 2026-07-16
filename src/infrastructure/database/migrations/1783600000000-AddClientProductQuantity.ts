import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClientProductQuantity1783600000000 implements MigrationInterface {
  name = 'AddClientProductQuantity1783600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "client_products" ADD "quantity" integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "client_products" DROP COLUMN "quantity"`,
    );
  }
}
