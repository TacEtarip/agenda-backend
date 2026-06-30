import { MigrationInterface, QueryRunner } from 'typeorm';

export class IndependentPayments1760000000000 implements MigrationInterface {
  name = 'IndependentPayments1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.startTransaction();
    try {
      await queryRunner.query(`CREATE TYPE "payments_status_enum" AS ENUM ('PENDING','PAID','FAILED','CANCELLED','REFUNDED')`);
      await queryRunner.query(`CREATE TYPE "payments_origin_enum" AS ENUM ('PAYMENT_LINK','MANUAL')`);
      await queryRunner.query(`CREATE TYPE "payments_method_enum" AS ENUM ('ONLINE','CASH','BANK_TRANSFER','YAPE','PLIN','CARD','OTHER')`);
      await queryRunner.query(`CREATE TYPE "products_type_enum" AS ENUM ('PRODUCT','SERVICE')`);
      await queryRunner.query(`ALTER TABLE "products" ADD "type" "products_type_enum" NOT NULL DEFAULT 'PRODUCT'`);
      await queryRunner.query(`
        CREATE TABLE "payments" (
          "id" uuid NOT NULL DEFAULT gen_random_uuid(),
          "company_id" uuid NOT NULL,
          "client_id" uuid NOT NULL,
          "appointment_id" uuid,
          "client_product_id" uuid,
          "amount" numeric(12,2) NOT NULL,
          "currency" varchar(3) NOT NULL DEFAULT 'PEN',
          "description" text NOT NULL,
          "status" "payments_status_enum" NOT NULL,
          "origin" "payments_origin_enum" NOT NULL,
          "method" "payments_method_enum" NOT NULL,
          "provider_payment_id" varchar,
          "checkout_url" text,
          "reference" varchar,
          "paid_at" timestamp,
          "created_at" timestamp NOT NULL DEFAULT now(),
          "updated_at" timestamp NOT NULL DEFAULT now(),
          CONSTRAINT "PK_payments" PRIMARY KEY ("id"),
          CONSTRAINT "CHK_payments_exactly_one_source" CHECK (("appointment_id" IS NOT NULL) <> ("client_product_id" IS NOT NULL)),
          CONSTRAINT "FK_payments_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE,
          CONSTRAINT "FK_payments_client" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE,
          CONSTRAINT "FK_payments_appointment" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE RESTRICT,
          CONSTRAINT "FK_payments_client_product" FOREIGN KEY ("client_product_id") REFERENCES "client_products"("id") ON DELETE RESTRICT
        )
      `);
      await queryRunner.query(`CREATE INDEX "IDX_payments_company_status" ON "payments" ("company_id", "status")`);
      await queryRunner.query(`CREATE INDEX "IDX_payments_client" ON "payments" ("client_id")`);
      await queryRunner.query(`CREATE INDEX "IDX_payments_appointment" ON "payments" ("appointment_id")`);
      await queryRunner.query(`CREATE INDEX "IDX_payments_client_product" ON "payments" ("client_product_id")`);
      await queryRunner.query(`CREATE UNIQUE INDEX "UQ_payments_provider_payment_id" ON "payments" ("provider_payment_id") WHERE "provider_payment_id" IS NOT NULL`);
      await queryRunner.query(`CREATE UNIQUE INDEX "UQ_payments_pending_appointment" ON "payments" ("appointment_id") WHERE "status" = 'PENDING' AND "appointment_id" IS NOT NULL`);
      await queryRunner.query(`CREATE UNIQUE INDEX "UQ_payments_paid_appointment" ON "payments" ("appointment_id") WHERE "status" = 'PAID' AND "appointment_id" IS NOT NULL`);
      await queryRunner.query(`CREATE UNIQUE INDEX "UQ_payments_pending_client_product" ON "payments" ("client_product_id") WHERE "status" = 'PENDING' AND "client_product_id" IS NOT NULL`);
      await queryRunner.query(`CREATE UNIQUE INDEX "UQ_payments_paid_client_product" ON "payments" ("client_product_id") WHERE "status" = 'PAID' AND "client_product_id" IS NOT NULL`);

      await queryRunner.query(`
        INSERT INTO "payments" (
          "company_id", "client_id", "appointment_id", "amount", "currency", "description",
          "status", "origin", "method", "provider_payment_id", "checkout_url", "paid_at"
        )
        SELECT "company_id", "client_id", "id", 50, 'PEN', "title",
          CASE WHEN "status" = 'pending_payment' THEN 'PENDING'::"payments_status_enum" ELSE 'PAID'::"payments_status_enum" END,
          'PAYMENT_LINK', 'ONLINE', "payment_id", "payment_url",
          CASE WHEN "status" = 'scheduled' THEN now() ELSE NULL END
        FROM "appointments"
        WHERE "payment_id" IS NOT NULL OR "payment_url" IS NOT NULL
      `);
      await queryRunner.query(`UPDATE "appointments" SET "status" = 'scheduled' WHERE "status" = 'pending_payment'`);
      await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN "payment_id"`);
      await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN "payment_url"`);
      await queryRunner.query(`ALTER TABLE "appointments" ALTER COLUMN "status" DROP DEFAULT`);
      await queryRunner.query(`ALTER TYPE "appointments_status_enum" RENAME TO "appointments_status_enum_old"`);
      await queryRunner.query(`CREATE TYPE "appointments_status_enum" AS ENUM ('scheduled','completed','cancelled')`);
      await queryRunner.query(`ALTER TABLE "appointments" ALTER COLUMN "status" TYPE "appointments_status_enum" USING "status"::text::"appointments_status_enum"`);
      await queryRunner.query(`ALTER TABLE "appointments" ALTER COLUMN "status" SET DEFAULT 'scheduled'`);
      await queryRunner.query(`DROP TYPE "appointments_status_enum_old"`);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "appointments" ALTER COLUMN "status" DROP DEFAULT`);
    await queryRunner.query(`ALTER TYPE "appointments_status_enum" RENAME TO "appointments_status_enum_new"`);
    await queryRunner.query(`CREATE TYPE "appointments_status_enum" AS ENUM ('scheduled','pending_payment','completed','cancelled')`);
    await queryRunner.query(`ALTER TABLE "appointments" ALTER COLUMN "status" TYPE "appointments_status_enum" USING "status"::text::"appointments_status_enum"`);
    await queryRunner.query(`ALTER TABLE "appointments" ALTER COLUMN "status" SET DEFAULT 'scheduled'`);
    await queryRunner.query(`DROP TYPE "appointments_status_enum_new"`);
    await queryRunner.query(`ALTER TABLE "appointments" ADD "payment_url" varchar`);
    await queryRunner.query(`ALTER TABLE "appointments" ADD "payment_id" varchar`);
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "payments_status_enum"`);
    await queryRunner.query(`DROP TYPE "payments_origin_enum"`);
    await queryRunner.query(`DROP TYPE "payments_method_enum"`);
    await queryRunner.query(`DROP TYPE "products_type_enum"`);
  }
}
