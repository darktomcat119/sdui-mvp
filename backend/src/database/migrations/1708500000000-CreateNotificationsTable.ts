import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationsTable1708500000000
  implements MigrationInterface
{
  name = 'CreateNotificationsTable1708500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create notification type enum
    await queryRunner.query(`
      CREATE TYPE "notification_type_enum" AS ENUM ('info', 'warning', 'success', 'error')
    `);

    // Create notifications table
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "municipality_id" UUID REFERENCES "municipalities"("id") ON DELETE CASCADE,
        "title" VARCHAR(255) NOT NULL,
        "message" TEXT NOT NULL,
        "type" "notification_type_enum" NOT NULL DEFAULT 'info',
        "is_read" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Indexes
    await queryRunner.query(
      `CREATE INDEX "idx_notifications_user_read" ON "notifications" ("user_id", "is_read")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_notifications_municipality" ON "notifications" ("municipality_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_notifications_created" ON "notifications" ("created_at")`,
    );

    // Grant permissions to sdui_app user
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'sdui_app') THEN
          GRANT SELECT, INSERT, UPDATE, DELETE ON "notifications" TO sdui_app;
        END IF;
      END
      $$
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_type_enum"`);
  }
}
