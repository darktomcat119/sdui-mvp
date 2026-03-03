import { MigrationInterface, QueryRunner } from 'typeorm';

export class Milestone3Documents1708800000000 implements MigrationInterface {
  name = 'Milestone3Documents1708800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // =========================================
    // 1. Documents table
    // =========================================
    await queryRunner.query(`
      CREATE TABLE "documentos" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "municipality_id" UUID NOT NULL REFERENCES "municipalities"("id") ON DELETE CASCADE,
        "determination_id" UUID REFERENCES "determinations"("id") ON DELETE SET NULL,
        "tipo" VARCHAR(30) NOT NULL CHECK (tipo IN ('dictamen', 'resolucion', 'acta', 'otro')),
        "nombre_archivo" VARCHAR(255) NOT NULL,
        "ruta_archivo" VARCHAR(500) NOT NULL,
        "hash_sha256" VARCHAR(64) NOT NULL,
        "tamano_bytes" INTEGER NOT NULL,
        "generado_por" UUID NOT NULL REFERENCES "users"("id"),
        "firmado" BOOLEAN DEFAULT false,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_documentos_municipality" ON "documentos" ("municipality_id")`);
    await queryRunner.query(`CREATE INDEX "idx_documentos_determination" ON "documentos" ("determination_id")`);
    await queryRunner.query(`CREATE INDEX "idx_documentos_hash" ON "documentos" ("hash_sha256")`);
    await queryRunner.query(`CREATE INDEX "idx_documentos_tipo" ON "documentos" ("tipo")`);

    // =========================================
    // 2. Grant permissions to sdui_app
    // =========================================
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'sdui_app') THEN
          GRANT SELECT, INSERT ON "documentos" TO sdui_app;
        END IF;
      END
      $$
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "documentos" CASCADE`);
  }
}
