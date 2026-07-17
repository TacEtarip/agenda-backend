import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppointmentScheduleConflicts1784200000000 implements MigrationInterface {
  name = 'AddAppointmentScheduleConflicts1784200000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."appointment_schedule_conflicts_source_enum"
      AS ENUM('google')
    `);
    await queryRunner.query(`
      CREATE TABLE "appointment_schedule_conflicts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "appointment_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "source" "public"."appointment_schedule_conflicts_source_enum" NOT NULL,
        "external_event_id" character varying NOT NULL,
        "conflict_start_time" TIMESTAMP WITH TIME ZONE NOT NULL,
        "conflict_end_time" TIMESTAMP WITH TIME ZONE NOT NULL,
        "detected_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "resolved_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_appointment_schedule_conflicts" PRIMARY KEY ("id"),
        CONSTRAINT "FK_appointment_schedule_conflicts_appointment"
          FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id")
          ON DELETE CASCADE,
        CONSTRAINT "FK_appointment_schedule_conflicts_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id")
          ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_appointment_schedule_conflicts_active_appointment"
      ON "appointment_schedule_conflicts" ("appointment_id", "resolved_at")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_appointment_schedule_conflicts_active_google_event"
      ON "appointment_schedule_conflicts"
      ("user_id", "source", "external_event_id", "resolved_at")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_appointment_schedule_conflicts_active_event"
      ON "appointment_schedule_conflicts"
      ("appointment_id", "source", "external_event_id")
      WHERE "resolved_at" IS NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "appointment_schedule_conflicts"');
    await queryRunner.query(
      'DROP TYPE "public"."appointment_schedule_conflicts_source_enum"',
    );
  }
}
