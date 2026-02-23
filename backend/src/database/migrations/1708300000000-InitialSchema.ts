import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1708300000000 implements MigrationInterface {
  name = 'InitialSchema1708300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID generation
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // Municipalities table
    await queryRunner.query(`
      CREATE TABLE "municipalities" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(200) NOT NULL,
        "slug" VARCHAR(100) NOT NULL UNIQUE,
        "state" VARCHAR(100) NOT NULL,
        "official_name" VARCHAR(300),
        "status" VARCHAR(20) NOT NULL DEFAULT 'active'
          CHECK (status IN ('active', 'inactive', 'suspended')),
        "config" JSONB NOT NULL DEFAULT '{}',
        "timezone" VARCHAR(50) NOT NULL DEFAULT 'America/Mexico_City',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_municipalities_slug" ON "municipalities" ("slug")`);
    await queryRunner.query(`CREATE INDEX "idx_municipalities_status" ON "municipalities" ("status")`);

    // Users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "municipality_id" UUID REFERENCES "municipalities"("id") ON DELETE RESTRICT,
        "email" VARCHAR(255) NOT NULL,
        "password_hash" VARCHAR(255) NOT NULL,
        "first_name" VARCHAR(100) NOT NULL,
        "last_name" VARCHAR(100) NOT NULL,
        "role" VARCHAR(30) NOT NULL
          CHECK (role IN ('system_admin', 'municipal_admin', 'treasury_operator', 'legal_analyst', 'comptroller_auditor')),
        "status" VARCHAR(20) NOT NULL DEFAULT 'active'
          CHECK (status IN ('active', 'inactive', 'locked')),
        "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
        "locked_until" TIMESTAMPTZ,
        "last_login_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "uq_users_email_municipality" UNIQUE ("email", "municipality_id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_users_municipality" ON "users" ("municipality_id")`);
    await queryRunner.query(`CREATE INDEX "idx_users_email" ON "users" ("email")`);
    await queryRunner.query(`CREATE INDEX "idx_users_role" ON "users" ("role")`);
    await queryRunner.query(`CREATE INDEX "idx_users_status" ON "users" ("status")`);

    // Refresh tokens table
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "token_hash" VARCHAR(255) NOT NULL,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "revoked_at" TIMESTAMPTZ,
        "ip_address" INET,
        "user_agent" VARCHAR(500),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_refresh_tokens_user" ON "refresh_tokens" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_refresh_tokens_hash" ON "refresh_tokens" ("token_hash")`);
    await queryRunner.query(`CREATE INDEX "idx_refresh_tokens_expires" ON "refresh_tokens" ("expires_at")`);

    // Audit logs table (immutable - INSERT only)
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "municipality_id" UUID REFERENCES "municipalities"("id"),
        "user_id" UUID NOT NULL REFERENCES "users"("id"),
        "user_name" VARCHAR(200) NOT NULL,
        "user_role" VARCHAR(30) NOT NULL,
        "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "source_ip" INET,
        "action" VARCHAR(50) NOT NULL,
        "module" VARCHAR(50) NOT NULL,
        "entity_type" VARCHAR(50),
        "entity_id" UUID,
        "data_before" JSONB,
        "data_after" JSONB,
        "metadata" JSONB DEFAULT '{}',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_audit_municipality" ON "audit_logs" ("municipality_id")`);
    await queryRunner.query(`CREATE INDEX "idx_audit_user" ON "audit_logs" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_audit_action" ON "audit_logs" ("action")`);
    await queryRunner.query(`CREATE INDEX "idx_audit_module" ON "audit_logs" ("module")`);
    await queryRunner.query(`CREATE INDEX "idx_audit_timestamp" ON "audit_logs" ("timestamp")`);
    await queryRunner.query(`CREATE INDEX "idx_audit_entity" ON "audit_logs" ("entity_type", "entity_id")`);

    // Grant permissions to sdui_app user
    // (sdui_app was created in docker/postgres/init.sql)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'sdui_app') THEN
          GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sdui_app;
          GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sdui_app;
          -- Revoke destructive operations on audit_logs
          REVOKE UPDATE, DELETE ON "audit_logs" FROM sdui_app;
        END IF;
      END
      $$
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "municipalities" CASCADE`);
  }
}
