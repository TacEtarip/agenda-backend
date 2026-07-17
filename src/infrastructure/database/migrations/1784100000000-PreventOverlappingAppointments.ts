import { MigrationInterface, QueryRunner } from 'typeorm';

export class PreventOverlappingAppointments1784100000000 implements MigrationInterface {
  name = 'PreventOverlappingAppointments1784100000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const conflicts = (await queryRunner.query(`
      SELECT first_appointment.id
      FROM "appointments" first_appointment
      INNER JOIN "appointments" second_appointment
        ON first_appointment."user_id" = second_appointment."user_id"
       AND first_appointment.id < second_appointment.id
       AND first_appointment."start_time" < second_appointment."end_time"
       AND first_appointment."end_time" > second_appointment."start_time"
      WHERE first_appointment.status = 'scheduled'
        AND second_appointment.status = 'scheduled'
        AND first_appointment."deleted_at" IS NULL
        AND second_appointment."deleted_at" IS NULL
      LIMIT 1
    `)) as Array<{ id: string }>;

    if (conflicts.length > 0) {
      throw new Error(
        'Cannot enable appointment overlap protection while scheduled conflicts exist',
      );
    }

    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "btree_gist"');
    await queryRunner.query(`
      ALTER TABLE "appointments"
      ADD CONSTRAINT "EXCL_appointments_user_scheduled_time"
      EXCLUDE USING gist (
        "user_id" WITH =,
        tstzrange("start_time", "end_time", '[)') WITH &&
      )
      WHERE (status = 'scheduled' AND "deleted_at" IS NULL)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "appointments"
      DROP CONSTRAINT IF EXISTS "EXCL_appointments_user_scheduled_time"
    `);
  }
}
