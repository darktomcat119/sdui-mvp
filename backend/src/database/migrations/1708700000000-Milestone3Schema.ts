import { MigrationInterface, QueryRunner } from 'typeorm';

export class Milestone3Schema1708700000000 implements MigrationInterface {
  name = 'Milestone3Schema1708700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // =========================================
    // 1. Add cuota_base_legal to municipalities
    // =========================================
    await queryRunner.query(`
      ALTER TABLE "municipalities"
      ADD COLUMN "cuota_base_legal" NUMERIC(12,2) DEFAULT NULL
    `);

    // =========================================
    // 2. Add validador_tecnico to users role CHECK
    // =========================================
    await queryRunner.query(`
      ALTER TABLE "users" DROP CONSTRAINT IF EXISTS users_role_check
    `);
    await queryRunner.query(`
      ALTER TABLE "users" ADD CONSTRAINT users_role_check
      CHECK (role IN ('system_admin', 'municipal_admin', 'treasury_operator',
                      'legal_analyst', 'comptroller_auditor', 'validador_tecnico'))
    `);

    // =========================================
    // 3. Add cuota_base_legal + config_version_id to determinations
    // =========================================
    await queryRunner.query(`
      ALTER TABLE "determinations"
      ADD COLUMN "cuota_base_legal" NUMERIC(12,2)
    `);

    // =========================================
    // 4. Central Config Versions table
    // =========================================
    await queryRunner.query(`
      CREATE TABLE "central_config_versions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "version" INTEGER NOT NULL,
        "p_superficie_min" NUMERIC(5,4) NOT NULL DEFAULT 0.2500,
        "p_superficie_max" NUMERIC(5,4) NOT NULL DEFAULT 0.4000,
        "p_zona_min" NUMERIC(5,4) NOT NULL DEFAULT 0.2000,
        "p_zona_max" NUMERIC(5,4) NOT NULL DEFAULT 0.3000,
        "p_giro_min" NUMERIC(5,4) NOT NULL DEFAULT 0.1500,
        "p_giro_max" NUMERIC(5,4) NOT NULL DEFAULT 0.2500,
        "p_tipo_min" NUMERIC(5,4) NOT NULL DEFAULT 0.1000,
        "p_tipo_max" NUMERIC(5,4) NOT NULL DEFAULT 0.2000,
        "zone_mult_min" NUMERIC(4,2) NOT NULL DEFAULT 0.60,
        "zone_mult_max" NUMERIC(4,2) NOT NULL DEFAULT 1.50,
        "limite_variacion_pct_min" NUMERIC(5,4) NOT NULL DEFAULT 0.0100,
        "limite_variacion_pct_max" NUMERIC(5,4) NOT NULL DEFAULT 0.2500,
        "itd_protegido_threshold" NUMERIC(5,4) NOT NULL DEFAULT 0.3300,
        "itd_proporcional_threshold" NUMERIC(5,4) NOT NULL DEFAULT 0.6600,
        "activo" BOOLEAN NOT NULL DEFAULT false,
        "created_by" UUID NOT NULL REFERENCES "users"("id"),
        "justificacion" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_central_config_activo" ON "central_config_versions" ("activo")`);
    await queryRunner.query(`CREATE INDEX "idx_central_config_version" ON "central_config_versions" ("version")`);

    await queryRunner.query(`
      ALTER TABLE "determinations"
      ADD COLUMN "config_version_id" UUID REFERENCES "central_config_versions"("id")
    `);

    // =========================================
    // 5. Enhanced limit_exceptions
    // =========================================
    await queryRunner.query(`
      ALTER TABLE "limit_exceptions"
      ADD COLUMN "folio" VARCHAR(20)
    `);
    await queryRunner.query(`
      ALTER TABLE "limit_exceptions"
      ADD COLUMN "resolution_option" VARCHAR(10)
    `);
    await queryRunner.query(`
      ALTER TABLE "limit_exceptions"
      ADD COLUMN "escalated_to" UUID REFERENCES "users"("id")
    `);
    await queryRunner.query(`
      ALTER TABLE "limit_exceptions"
      ADD COLUMN "justificacion_resolucion" TEXT
    `);

    // Update estatus CHECK to include 'escalada'
    await queryRunner.query(`
      ALTER TABLE "limit_exceptions" DROP CONSTRAINT IF EXISTS limit_exceptions_estatus_check
    `);
    await queryRunner.query(`
      ALTER TABLE "limit_exceptions" ADD CONSTRAINT limit_exceptions_estatus_check
      CHECK (estatus IN ('pendiente', 'aprobada', 'rechazada', 'escalada'))
    `);

    await queryRunner.query(`CREATE INDEX "idx_exceptions_folio" ON "limit_exceptions" ("folio")`);

    // =========================================
    // 6. Grant permissions to sdui_app
    // =========================================
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'sdui_app') THEN
          GRANT SELECT, INSERT, UPDATE, DELETE ON "central_config_versions" TO sdui_app;
        END IF;
      END
      $$
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_exceptions_folio"`);
    await queryRunner.query(`ALTER TABLE "limit_exceptions" DROP COLUMN IF EXISTS "justificacion_resolucion"`);
    await queryRunner.query(`ALTER TABLE "limit_exceptions" DROP COLUMN IF EXISTS "escalated_to"`);
    await queryRunner.query(`ALTER TABLE "limit_exceptions" DROP COLUMN IF EXISTS "resolution_option"`);
    await queryRunner.query(`ALTER TABLE "limit_exceptions" DROP COLUMN IF EXISTS "folio"`);
    await queryRunner.query(`
      ALTER TABLE "limit_exceptions" DROP CONSTRAINT IF EXISTS limit_exceptions_estatus_check
    `);
    await queryRunner.query(`
      ALTER TABLE "limit_exceptions" ADD CONSTRAINT limit_exceptions_estatus_check
      CHECK (estatus IN ('pendiente', 'aprobada', 'rechazada'))
    `);

    await queryRunner.query(`ALTER TABLE "determinations" DROP COLUMN IF EXISTS "config_version_id"`);
    await queryRunner.query(`ALTER TABLE "determinations" DROP COLUMN IF EXISTS "cuota_base_legal"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "central_config_versions" CASCADE`);

    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS users_role_check`);
    await queryRunner.query(`
      ALTER TABLE "users" ADD CONSTRAINT users_role_check
      CHECK (role IN ('system_admin', 'municipal_admin', 'treasury_operator',
                      'legal_analyst', 'comptroller_auditor'))
    `);

    await queryRunner.query(`ALTER TABLE "municipalities" DROP COLUMN IF EXISTS "cuota_base_legal"`);
  }
}
