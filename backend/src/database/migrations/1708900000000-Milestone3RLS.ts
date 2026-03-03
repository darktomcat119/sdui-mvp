import { MigrationInterface, QueryRunner } from 'typeorm';

export class Milestone3RLS1708900000000 implements MigrationInterface {
  name = 'Milestone3RLS1708900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // =========================================
    // Enable Row Level Security on tenant-scoped tables
    // RLS policies enforce that sdui_app can only see rows
    // matching the current_setting('app.current_municipality_id').
    // The table owner (sdui_owner) bypasses RLS by default.
    // =========================================

    const tenantTables = [
      'taxpayers',
      'determinations',
      'weight_configurations',
      'limit_exceptions',
      'municipality_zones',
      'municipality_scian',
      'documentos',
    ];

    for (const table of tenantTables) {
      // Enable RLS
      await queryRunner.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);

      // Force RLS even for table owner is NOT desired — we want owner to bypass
      // so migrations and seeds work. RLS only applies to sdui_app.

      // SELECT policy
      await queryRunner.query(`
        CREATE POLICY "tenant_select_${table}" ON "${table}"
          FOR SELECT TO sdui_app
          USING (municipality_id = current_setting('app.current_municipality_id', true)::UUID)
      `);

      // INSERT policy
      await queryRunner.query(`
        CREATE POLICY "tenant_insert_${table}" ON "${table}"
          FOR INSERT TO sdui_app
          WITH CHECK (municipality_id = current_setting('app.current_municipality_id', true)::UUID)
      `);

      // UPDATE policy
      await queryRunner.query(`
        CREATE POLICY "tenant_update_${table}" ON "${table}"
          FOR UPDATE TO sdui_app
          USING (municipality_id = current_setting('app.current_municipality_id', true)::UUID)
      `);

      // DELETE policy (only on tables where DELETE is granted)
      if (!['determinations'].includes(table)) {
        await queryRunner.query(`
          CREATE POLICY "tenant_delete_${table}" ON "${table}"
            FOR DELETE TO sdui_app
            USING (municipality_id = current_setting('app.current_municipality_id', true)::UUID)
        `);
      }
    }

    // System admin bypass: when app.current_municipality_id is empty or not set,
    // the policies above will return no rows. For system_admin operations that
    // need cross-tenant access, we add a bypass policy that checks for the
    // 'app.is_system_admin' setting.
    for (const table of tenantTables) {
      await queryRunner.query(`
        CREATE POLICY "system_admin_bypass_${table}" ON "${table}"
          FOR ALL TO sdui_app
          USING (current_setting('app.is_system_admin', true) = 'true')
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tenantTables = [
      'taxpayers',
      'determinations',
      'weight_configurations',
      'limit_exceptions',
      'municipality_zones',
      'municipality_scian',
      'documentos',
    ];

    for (const table of tenantTables) {
      await queryRunner.query(`DROP POLICY IF EXISTS "system_admin_bypass_${table}" ON "${table}"`);
      await queryRunner.query(`DROP POLICY IF EXISTS "tenant_delete_${table}" ON "${table}"`);
      await queryRunner.query(`DROP POLICY IF EXISTS "tenant_update_${table}" ON "${table}"`);
      await queryRunner.query(`DROP POLICY IF EXISTS "tenant_insert_${table}" ON "${table}"`);
      await queryRunner.query(`DROP POLICY IF EXISTS "tenant_select_${table}" ON "${table}"`);
      await queryRunner.query(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY`);
    }
  }
}
