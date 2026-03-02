import { MigrationInterface, QueryRunner } from 'typeorm';

export class Milestone2Schema1708600000000 implements MigrationInterface {
  name = 'Milestone2Schema1708600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // =========================================
    // 1. SCIAN Catalog (Central — 305 codes)
    // =========================================
    await queryRunner.query(`
      CREATE TABLE "scian_catalog" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "codigo_scian" VARCHAR(4) NOT NULL UNIQUE,
        "descripcion_scian" VARCHAR(500) NOT NULL,
        "impacto_sdui" VARCHAR(5) NOT NULL CHECK (impacto_sdui IN ('bajo', 'medio', 'alto')),
        "activo" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_scian_codigo" ON "scian_catalog" ("codigo_scian")`);
    await queryRunner.query(`CREATE INDEX "idx_scian_impacto" ON "scian_catalog" ("impacto_sdui")`);
    await queryRunner.query(`CREATE INDEX "idx_scian_activo" ON "scian_catalog" ("activo")`);

    // =========================================
    // 2. Municipality-SCIAN junction
    // =========================================
    await queryRunner.query(`
      CREATE TABLE "municipality_scian" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "municipality_id" UUID NOT NULL REFERENCES "municipalities"("id") ON DELETE CASCADE,
        "scian_id" UUID NOT NULL REFERENCES "scian_catalog"("id") ON DELETE CASCADE,
        "activo" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE ("municipality_id", "scian_id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_muni_scian_municipality" ON "municipality_scian" ("municipality_id")`);
    await queryRunner.query(`CREATE INDEX "idx_muni_scian_scian" ON "municipality_scian" ("scian_id")`);

    // =========================================
    // 3. Zone Catalog (Central)
    // =========================================
    await queryRunner.query(`
      CREATE TABLE "zone_catalog" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "codigo_zona" VARCHAR(20) NOT NULL,
        "nombre_zona" VARCHAR(200) NOT NULL,
        "activo" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_zone_codigo" ON "zone_catalog" ("codigo_zona")`);
    await queryRunner.query(`CREATE INDEX "idx_zone_activo" ON "zone_catalog" ("activo")`);

    // =========================================
    // 4. Municipality Zones (Config per municipality)
    // =========================================
    await queryRunner.query(`
      CREATE TABLE "municipality_zones" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "municipality_id" UUID NOT NULL REFERENCES "municipalities"("id") ON DELETE CASCADE,
        "zone_id" UUID NOT NULL REFERENCES "zone_catalog"("id") ON DELETE CASCADE,
        "nivel_demanda" VARCHAR(5) NOT NULL CHECK (nivel_demanda IN ('baja', 'media', 'alta')),
        "multiplicador" NUMERIC(4,2) NOT NULL CHECK (multiplicador >= 0.60 AND multiplicador <= 1.50),
        "vigencia_desde" DATE NOT NULL,
        "vigencia_hasta" DATE,
        "justificacion" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE ("municipality_id", "zone_id", "vigencia_desde")
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_muni_zones_municipality" ON "municipality_zones" ("municipality_id")`);
    await queryRunner.query(`CREATE INDEX "idx_muni_zones_zone" ON "municipality_zones" ("zone_id")`);

    // =========================================
    // 5. Weight Configurations (Ponderaciones)
    // =========================================
    await queryRunner.query(`
      CREATE TABLE "weight_configurations" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "municipality_id" UUID NOT NULL REFERENCES "municipalities"("id") ON DELETE CASCADE,
        "p_superficie" NUMERIC(5,4) NOT NULL CHECK (p_superficie >= 0.25 AND p_superficie <= 0.40),
        "p_zona" NUMERIC(5,4) NOT NULL CHECK (p_zona >= 0.20 AND p_zona <= 0.30),
        "p_giro" NUMERIC(5,4) NOT NULL CHECK (p_giro >= 0.15 AND p_giro <= 0.25),
        "p_tipo" NUMERIC(5,4) NOT NULL CHECK (p_tipo >= 0.10 AND p_tipo <= 0.20),
        "limite_variacion_pct" NUMERIC(5,4) NOT NULL CHECK (limite_variacion_pct >= 0.01 AND limite_variacion_pct <= 0.25),
        "ejercicio_fiscal" INTEGER NOT NULL,
        "vigencia_desde" DATE NOT NULL,
        "vigencia_hasta" DATE,
        "justificacion" TEXT,
        "folio_acta" VARCHAR(50),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE ("municipality_id", "ejercicio_fiscal"),
        CHECK (p_superficie + p_zona + p_giro + p_tipo = 1.0000)
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_weights_municipality" ON "weight_configurations" ("municipality_id")`);
    await queryRunner.query(`CREATE INDEX "idx_weights_fiscal" ON "weight_configurations" ("ejercicio_fiscal")`);

    // =========================================
    // 6. Taxpayers (Contribuyentes / Padrón)
    // =========================================
    await queryRunner.query(`
      CREATE TABLE "taxpayers" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "municipality_id" UUID NOT NULL REFERENCES "municipalities"("id") ON DELETE CASCADE,
        "razon_social" VARCHAR(300) NOT NULL,
        "tipo_personalidad" VARCHAR(10) NOT NULL CHECK (tipo_personalidad IN ('fisica', 'moral')),
        "rfc" VARCHAR(13),
        "curp" VARCHAR(18),
        "tipo_tramite" VARCHAR(15) NOT NULL CHECK (tipo_tramite IN ('apertura', 'renovacion')),
        "numero_licencia" VARCHAR(50),
        "clave_catastral" VARCHAR(50),
        "uso_suelo" VARCHAR(100),
        "actividad_regulada" TEXT,
        "scian_id" UUID NOT NULL REFERENCES "scian_catalog"("id"),
        "zone_id" UUID NOT NULL REFERENCES "zone_catalog"("id"),
        "tipo_contribuyente" VARCHAR(15) NOT NULL CHECK (tipo_contribuyente IN ('independiente', 'franquicia', 'cadena')),
        "superficie_m2" NUMERIC(10,2) NOT NULL CHECK (superficie_m2 > 0),
        "cuota_vigente" NUMERIC(12,2) NOT NULL CHECK (cuota_vigente >= 0),
        "estatus" VARCHAR(15) NOT NULL DEFAULT 'activo' CHECK (estatus IN ('activo', 'inactivo', 'suspendido')),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_taxpayers_municipality" ON "taxpayers" ("municipality_id")`);
    await queryRunner.query(`CREATE INDEX "idx_taxpayers_scian" ON "taxpayers" ("scian_id")`);
    await queryRunner.query(`CREATE INDEX "idx_taxpayers_zone" ON "taxpayers" ("zone_id")`);
    await queryRunner.query(`CREATE INDEX "idx_taxpayers_rfc" ON "taxpayers" ("rfc")`);
    await queryRunner.query(`CREATE INDEX "idx_taxpayers_estatus" ON "taxpayers" ("estatus")`);
    await queryRunner.query(`CREATE INDEX "idx_taxpayers_tipo" ON "taxpayers" ("tipo_contribuyente")`);

    // =========================================
    // 7. Determinations (Determinaciones técnicas)
    // =========================================
    await queryRunner.query(`
      CREATE TABLE "determinations" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "municipality_id" UUID NOT NULL REFERENCES "municipalities"("id") ON DELETE CASCADE,
        "taxpayer_id" UUID NOT NULL REFERENCES "taxpayers"("id") ON DELETE CASCADE,
        "weight_config_id" UUID NOT NULL REFERENCES "weight_configurations"("id"),
        "ejercicio_fiscal" INTEGER NOT NULL,
        "v_superficie" NUMERIC(6,4) NOT NULL,
        "v_zona" NUMERIC(6,4) NOT NULL,
        "v_giro" NUMERIC(6,4) NOT NULL,
        "v_tipo" NUMERIC(6,4) NOT NULL,
        "p_superficie" NUMERIC(5,4) NOT NULL,
        "p_zona" NUMERIC(5,4) NOT NULL,
        "p_giro" NUMERIC(5,4) NOT NULL,
        "p_tipo" NUMERIC(5,4) NOT NULL,
        "itd" NUMERIC(6,4) NOT NULL,
        "clasificacion" VARCHAR(15) NOT NULL CHECK (clasificacion IN ('protegido', 'moderado', 'proporcional')),
        "cuota_vigente" NUMERIC(12,2) NOT NULL,
        "cuota_sdui" NUMERIC(12,2) NOT NULL,
        "variacion_pct" NUMERIC(8,4) NOT NULL,
        "limite_pct_aplicado" NUMERIC(5,4) NOT NULL,
        "estatus" VARCHAR(20) NOT NULL DEFAULT 'calculada' CHECK (estatus IN ('calculada', 'aprobada', 'bloqueada', 'excepcion_pendiente')),
        "fundamento_normativo" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_determ_municipality" ON "determinations" ("municipality_id")`);
    await queryRunner.query(`CREATE INDEX "idx_determ_taxpayer" ON "determinations" ("taxpayer_id")`);
    await queryRunner.query(`CREATE INDEX "idx_determ_fiscal" ON "determinations" ("ejercicio_fiscal")`);
    await queryRunner.query(`CREATE INDEX "idx_determ_clasificacion" ON "determinations" ("clasificacion")`);
    await queryRunner.query(`CREATE INDEX "idx_determ_estatus" ON "determinations" ("estatus")`);
    await queryRunner.query(`CREATE INDEX "idx_determ_weight_config" ON "determinations" ("weight_config_id")`);

    // =========================================
    // 8. Limit Exceptions (Excepciones de límite)
    // =========================================
    await queryRunner.query(`
      CREATE TABLE "limit_exceptions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "determination_id" UUID NOT NULL REFERENCES "determinations"("id") ON DELETE CASCADE,
        "municipality_id" UUID NOT NULL REFERENCES "municipalities"("id") ON DELETE CASCADE,
        "valor_propuesto" NUMERIC(12,2) NOT NULL,
        "limite_pct" NUMERIC(5,4) NOT NULL,
        "motivo" TEXT NOT NULL,
        "estatus" VARCHAR(15) NOT NULL DEFAULT 'pendiente' CHECK (estatus IN ('pendiente', 'aprobada', 'rechazada')),
        "aprobado_por" UUID REFERENCES "users"("id"),
        "fecha_resolucion" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_exceptions_determination" ON "limit_exceptions" ("determination_id")`);
    await queryRunner.query(`CREATE INDEX "idx_exceptions_municipality" ON "limit_exceptions" ("municipality_id")`);
    await queryRunner.query(`CREATE INDEX "idx_exceptions_estatus" ON "limit_exceptions" ("estatus")`);

    // =========================================
    // Grant permissions to sdui_app
    // =========================================
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'sdui_app') THEN
          GRANT SELECT, INSERT, UPDATE, DELETE ON "scian_catalog" TO sdui_app;
          GRANT SELECT, INSERT, UPDATE, DELETE ON "municipality_scian" TO sdui_app;
          GRANT SELECT, INSERT, UPDATE, DELETE ON "zone_catalog" TO sdui_app;
          GRANT SELECT, INSERT, UPDATE, DELETE ON "municipality_zones" TO sdui_app;
          GRANT SELECT, INSERT, UPDATE, DELETE ON "weight_configurations" TO sdui_app;
          GRANT SELECT, INSERT, UPDATE, DELETE ON "taxpayers" TO sdui_app;
          GRANT SELECT, INSERT, UPDATE ON "determinations" TO sdui_app;
          GRANT SELECT, INSERT, UPDATE, DELETE ON "limit_exceptions" TO sdui_app;
        END IF;
      END
      $$
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "limit_exceptions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "determinations" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "taxpayers" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "weight_configurations" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "municipality_zones" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "zone_catalog" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "municipality_scian" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "scian_catalog" CASCADE`);
  }
}
