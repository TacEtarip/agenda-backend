import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClientProductCustomPrice1783500000000 implements MigrationInterface {
  name = 'AddClientProductCustomPrice1783500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "client_products" ADD "custom_price" numeric(12,2)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "client_products" DROP COLUMN "custom_price"`,
    );
  }
}
