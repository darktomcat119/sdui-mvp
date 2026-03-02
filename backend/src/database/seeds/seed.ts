import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  database: process.env.DATABASE_NAME || 'sdui',
  username: process.env.DATABASE_OWNER_USER || 'sdui_owner',
  password: process.env.DATABASE_OWNER_PASSWORD || 'sdui_dev_password',
});

async function seed() {
  await dataSource.initialize();
  console.log('Connected to database. Starting seed...');

  const passwordHash = await bcrypt.hash('Admin123!', 12);

  // ===========================
  // 1. Municipalities
  // ===========================
  const existingMunicipalities = await dataSource.query(
    `SELECT slug FROM municipalities`,
  );
  const existingSlugs = existingMunicipalities.map((m: any) => m.slug);

  let ejemploId: string;
  let pruebaId: string;

  if (!existingSlugs.includes('ejemplo')) {
    const result = await dataSource.query(
      `INSERT INTO municipalities (name, slug, state, official_name, status, config, timezone)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        'Municipio de Ejemplo',
        'ejemplo',
        'Jalisco',
        'H. Ayuntamiento del Municipio de Ejemplo',
        'active',
        '{}',
        'America/Mexico_City',
      ],
    );
    ejemploId = result[0].id;
    console.log(`Created municipality: Municipio de Ejemplo (${ejemploId})`);
  } else {
    const result = await dataSource.query(
      `SELECT id FROM municipalities WHERE slug = 'ejemplo'`,
    );
    ejemploId = result[0].id;
    console.log(`Municipality "ejemplo" already exists (${ejemploId})`);
  }

  if (!existingSlugs.includes('prueba')) {
    const result = await dataSource.query(
      `INSERT INTO municipalities (name, slug, state, official_name, status, config, timezone)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        'Municipio de Prueba',
        'prueba',
        'Nuevo Leon',
        'H. Ayuntamiento del Municipio de Prueba',
        'active',
        '{}',
        'America/Mexico_City',
      ],
    );
    pruebaId = result[0].id;
    console.log(`Created municipality: Municipio de Prueba (${pruebaId})`);
  } else {
    const result = await dataSource.query(
      `SELECT id FROM municipalities WHERE slug = 'prueba'`,
    );
    pruebaId = result[0].id;
    console.log(`Municipality "prueba" already exists (${pruebaId})`);
  }

  // ===========================
  // 2. Users
  // ===========================
  const seedUsers = [
    { email: 'admin@sdui.gob.mx', firstName: 'Admin', lastName: 'Sistema', role: 'system_admin', municipalityId: null },
    { email: 'admin@ejemplo.gob.mx', firstName: 'Carlos', lastName: 'Martinez', role: 'municipal_admin', municipalityId: ejemploId },
    { email: 'tesoreria@ejemplo.gob.mx', firstName: 'Maria', lastName: 'Lopez', role: 'treasury_operator', municipalityId: ejemploId },
    { email: 'legal@ejemplo.gob.mx', firstName: 'Roberto', lastName: 'Garcia', role: 'legal_analyst', municipalityId: ejemploId },
    { email: 'contralor@ejemplo.gob.mx', firstName: 'Ana', lastName: 'Hernandez', role: 'comptroller_auditor', municipalityId: ejemploId },
    { email: 'validador@ejemplo.gob.mx', firstName: 'Diego', lastName: 'Ramirez', role: 'validador_tecnico', municipalityId: ejemploId },
    { email: 'admin@prueba.gob.mx', firstName: 'Fernando', lastName: 'Rodriguez', role: 'municipal_admin', municipalityId: pruebaId },
    { email: 'tesoreria@prueba.gob.mx', firstName: 'Laura', lastName: 'Sanchez', role: 'treasury_operator', municipalityId: pruebaId },
    { email: 'legal@prueba.gob.mx', firstName: 'Jorge', lastName: 'Torres', role: 'legal_analyst', municipalityId: pruebaId },
    { email: 'contralor@prueba.gob.mx', firstName: 'Patricia', lastName: 'Flores', role: 'comptroller_auditor', municipalityId: pruebaId },
    { email: 'validador@prueba.gob.mx', firstName: 'Sofia', lastName: 'Mendoza', role: 'validador_tecnico', municipalityId: pruebaId },
  ];

  for (const user of seedUsers) {
    const existing = await dataSource.query(
      `SELECT id FROM users WHERE email = $1 AND (municipality_id = $2 OR ($2 IS NULL AND municipality_id IS NULL))`,
      [user.email, user.municipalityId],
    );

    if (existing.length === 0) {
      await dataSource.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, municipality_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'active')`,
        [user.email, passwordHash, user.firstName, user.lastName, user.role, user.municipalityId],
      );
      console.log(`Created user: ${user.email} (${user.role})`);
    } else {
      console.log(`User ${user.email} already exists`);
    }
  }

  // ===========================
  // 2b. Set cuota_base_legal for Ejemplo
  // ===========================
  await dataSource.query(
    `UPDATE municipalities SET cuota_base_legal = 1500.00 WHERE slug = 'ejemplo' AND cuota_base_legal IS NULL`,
  );
  console.log('Set cuota_base_legal = $1,500 for Ejemplo');

  // ===========================
  // 3. SCIAN Catalog (305 codes)
  // ===========================
  const scianCount = await dataSource.query(`SELECT COUNT(*) as count FROM scian_catalog`);
  if (parseInt(scianCount[0].count, 10) === 0) {
    const scianDataPath = path.join(__dirname, 'scian-data.json');
    const scianData: { c: string; d: string; i: string }[] = JSON.parse(
      fs.readFileSync(scianDataPath, 'utf-8'),
    );

    for (const item of scianData) {
      await dataSource.query(
        `INSERT INTO scian_catalog (codigo_scian, descripcion_scian, impacto_sdui) VALUES ($1, $2, $3)`,
        [item.c, item.d, item.i],
      );
    }
    console.log(`Seeded ${scianData.length} SCIAN codes`);
  } else {
    console.log('SCIAN catalog already seeded');
  }

  // ===========================
  // 4. Zone Catalog
  // ===========================
  const zoneCount = await dataSource.query(`SELECT COUNT(*) as count FROM zone_catalog`);
  if (parseInt(zoneCount[0].count, 10) === 0) {
    const zones = [
      { codigo: 'HAB', nombre: 'Habitacional' },
      { codigo: 'COM', nombre: 'Comercial' },
      { codigo: 'IND', nombre: 'Industrial' },
      { codigo: 'TUR', nombre: 'Turística' },
      { codigo: 'RUR', nombre: 'Rural' },
    ];

    for (const z of zones) {
      await dataSource.query(
        `INSERT INTO zone_catalog (codigo_zona, nombre_zona) VALUES ($1, $2)`,
        [z.codigo, z.nombre],
      );
    }
    console.log(`Seeded ${zones.length} zone types`);
  } else {
    console.log('Zone catalog already seeded');
  }

  // Get zone IDs for reference
  const zoneRows = await dataSource.query(`SELECT id, codigo_zona FROM zone_catalog`);
  const zoneMap = new Map<string, string>();
  for (const z of zoneRows) {
    zoneMap.set(z.codigo_zona, z.id);
  }

  // ===========================
  // 5. Municipality Zone Config (Ejemplo)
  // ===========================
  const muniZoneCount = await dataSource.query(
    `SELECT COUNT(*) as count FROM municipality_zones WHERE municipality_id = $1`,
    [ejemploId],
  );
  if (parseInt(muniZoneCount[0].count, 10) === 0) {
    const zoneConfigs = [
      { codigo: 'HAB', demanda: 'baja', mult: 0.75 },
      { codigo: 'COM', demanda: 'alta', mult: 1.30 },
      { codigo: 'IND', demanda: 'media', mult: 1.00 },
      { codigo: 'TUR', demanda: 'media', mult: 1.10 },
      { codigo: 'RUR', demanda: 'baja', mult: 0.65 },
    ];

    for (const zc of zoneConfigs) {
      const zoneId = zoneMap.get(zc.codigo);
      if (zoneId) {
        await dataSource.query(
          `INSERT INTO municipality_zones (municipality_id, zone_id, nivel_demanda, multiplicador, vigencia_desde, justificacion)
           VALUES ($1, $2, $3, $4, '2026-01-01', 'Configuración inicial piloto')`,
          [ejemploId, zoneId, zc.demanda, zc.mult],
        );
      }
    }
    console.log('Configured zones for Municipio de Ejemplo');
  } else {
    console.log('Municipality zones already configured for Ejemplo');
  }

  // ===========================
  // 6. Weight Configuration (Ejemplo)
  // ===========================
  const weightCount = await dataSource.query(
    `SELECT COUNT(*) as count FROM weight_configurations WHERE municipality_id = $1`,
    [ejemploId],
  );
  if (parseInt(weightCount[0].count, 10) === 0) {
    await dataSource.query(
      `INSERT INTO weight_configurations
       (municipality_id, p_superficie, p_zona, p_giro, p_tipo, limite_variacion_pct, ejercicio_fiscal, vigencia_desde, justificacion, folio_acta)
       VALUES ($1, 0.4000, 0.3000, 0.2000, 0.1000, 0.2000, 2026, '2026-01-01', 'Configuración inicial piloto SDUI', 'SDUI-ACT-EJ2026')`,
      [ejemploId],
    );
    console.log('Created weight configuration for Ejemplo (40/30/20/10, limit 20%)');
  } else {
    console.log('Weight configuration already exists for Ejemplo');
  }

  // ===========================
  // 7. Tulancingo Taxpayers (31 from test data)
  // ===========================
  const taxpayerCount = await dataSource.query(
    `SELECT COUNT(*) as count FROM taxpayers WHERE municipality_id = $1`,
    [ejemploId],
  );
  if (parseInt(taxpayerCount[0].count, 10) === 0) {
    // Map zone names to codes
    const zoneNameToCode: Record<string, string> = {
      Habitacional: 'HAB',
      Comercial: 'COM',
      Industrial: 'IND',
      'Turística': 'TUR',
      Rural: 'RUR',
    };

    // Map tipo names
    const tipoMap: Record<string, string> = {
      Independiente: 'independiente',
      Franquicia: 'franquicia',
      Cadena: 'cadena',
    };

    // Get SCIAN IDs
    const scianRows = await dataSource.query(`SELECT id, codigo_scian FROM scian_catalog`);
    const scianMap = new Map<string, string>();
    for (const s of scianRows) {
      scianMap.set(s.codigo_scian, s.id);
    }

    const taxpayers = [
      { name: 'Abarrotes Don Luis', scian: '4611', sup: 35, zona: 'Habitacional', tipo: 'Independiente', cuota: 1200, rfc: 'LUDL850612AB3' },
      { name: 'Papelería La Escolar', scian: '4653', sup: 28, zona: 'Habitacional', tipo: 'Independiente', cuota: 1100, rfc: 'GOME790310KL5' },
      { name: 'Farmacia Guadalajara #127', scian: '4641', sup: 280, zona: 'Comercial', tipo: 'Cadena', cuota: 4500, rfc: 'FGU920415HN80' },
      { name: 'OXXO Sucursal Norte', scian: '4621', sup: 120, zona: 'Comercial', tipo: 'Franquicia', cuota: 3200, rfc: 'CFE8507154S20' },
      { name: 'Taller Mecánico Hernández', scian: '8111', sup: 65, zona: 'Industrial', tipo: 'Independiente', cuota: 1800, rfc: 'HERJ880225MN4' },
      { name: 'Restaurante Mi Tierra', scian: '7225', sup: 90, zona: 'Comercial', tipo: 'Independiente', cuota: 2200, rfc: 'MART770918PQ2' },
      { name: 'Walmart Express #45', scian: '4621', sup: 450, zona: 'Comercial', tipo: 'Cadena', cuota: 6800, rfc: 'WMX960101AB10' },
      { name: 'Estética Lupita', scian: '8121', sup: 22, zona: 'Habitacional', tipo: 'Independiente', cuota: 900, rfc: 'LOPL900503CD6' },
      { name: 'Ferretería El Clavo', scian: '4671', sup: 55, zona: 'Habitacional', tipo: 'Independiente', cuota: 1500, rfc: 'RAMF820110EF7' },
      { name: 'Subway Sucursal Centro', scian: '7225', sup: 85, zona: 'Comercial', tipo: 'Franquicia', cuota: 2800, rfc: 'SUB050620GH30' },
      { name: 'Tortillería La Esperanza', scian: '3118', sup: 18, zona: 'Habitacional', tipo: 'Independiente', cuota: 800, rfc: 'SANE810415IJ8' },
      { name: 'Zapatería León', scian: '4633', sup: 42, zona: 'Habitacional', tipo: 'Independiente', cuota: 1300, rfc: 'LEOF750820KL9' },
      { name: 'Coppel Sucursal Sur', scian: '4622', sup: 600, zona: 'Comercial', tipo: 'Cadena', cuota: 8500, rfc: 'COP830915MN00' },
      { name: 'Taquería Los Compadres', scian: '7225', sup: 30, zona: 'Habitacional', tipo: 'Independiente', cuota: 1000, rfc: 'COML860712OP1' },
      { name: 'Gimnasio FitZone', scian: '7139', sup: 200, zona: 'Comercial', tipo: 'Independiente', cuota: 3500, rfc: 'GFZ180301QR20' },
      { name: '7-Eleven #892', scian: '4621', sup: 95, zona: 'Comercial', tipo: 'Franquicia', cuota: 2600, rfc: 'SEL891101ST30' },
      { name: 'Mercería Doña Carmen', scian: '4631', sup: 20, zona: 'Habitacional', tipo: 'Independiente', cuota: 850, rfc: 'GARC680205UV4' },
      { name: 'Veterinaria San Francisco', scian: '6213', sup: 48, zona: 'Habitacional', tipo: 'Independiente', cuota: 1400, rfc: 'PERF910630WX5' },
      { name: 'Banco Azteca Suc. Centro', scian: '5221', sup: 180, zona: 'Comercial', tipo: 'Cadena', cuota: 5200, rfc: 'BAZ010815YZ60' },
      { name: 'Carnicería El Toro', scian: '4611', sup: 25, zona: 'Habitacional', tipo: 'Independiente', cuota: 950, rfc: 'TORG730415AB7' },
      { name: 'Lavandería Express', scian: '8122', sup: 40, zona: 'Habitacional', tipo: 'Independiente', cuota: 1250, rfc: 'EXPG850920CD8' },
      { name: 'Hotel Posada Real', scian: '7211', sup: 350, zona: 'Turística', tipo: 'Independiente', cuota: 5800, rfc: 'HPR950510EF90' },
      { name: 'Dulcería La Piñata', scian: '4611', sup: 15, zona: 'Habitacional', tipo: 'Independiente', cuota: 750, rfc: 'PINL880115GH0' },
      { name: 'Constructora del Norte SA', scian: '2362', sup: 500, zona: 'Industrial', tipo: 'Cadena', cuota: 7200, rfc: 'CDN880720IJ10' },
      { name: 'Panadería San José', scian: '3118', sup: 32, zona: 'Habitacional', tipo: 'Independiente', cuota: 1050, rfc: 'JOSM790225KL2' },
      { name: 'AutoZone Sucursal Oriente', scian: '4682', sup: 220, zona: 'Comercial', tipo: 'Franquicia', cuota: 4200, rfc: 'AZO020315MN30' },
      { name: 'Café Internet Compunet', scian: '5182', sup: 30, zona: 'Habitacional', tipo: 'Independiente', cuota: 1000, rfc: 'COMR920810OP4' },
      { name: 'Mueblería Imperial', scian: '4661', sup: 150, zona: 'Comercial', tipo: 'Independiente', cuota: 3000, rfc: 'MIM100505QR50' },
      { name: 'Spa Relax Total', scian: '8121', sup: 100, zona: 'Turística', tipo: 'Independiente', cuota: 2500, rfc: 'SRT160720ST60' },
      { name: 'Bodega Aurrera Express #12', scian: '4621', sup: 380, zona: 'Comercial', tipo: 'Cadena', cuota: 6200, rfc: 'BAE970101UV70' },
      { name: 'Óptica Visual Plus', scian: '6211', sup: 45, zona: 'Comercial', tipo: 'Independiente', cuota: 1600, rfc: 'VISP840630WX8' },
    ];

    for (const tp of taxpayers) {
      const scianId = scianMap.get(tp.scian);
      const zoneCode = zoneNameToCode[tp.zona];
      const zoneId = zoneCode ? zoneMap.get(zoneCode) : null;

      if (!scianId || !zoneId) {
        console.warn(`Skipping ${tp.name}: missing SCIAN ${tp.scian} or zone ${tp.zona}`);
        continue;
      }

      await dataSource.query(
        `INSERT INTO taxpayers
         (municipality_id, razon_social, tipo_personalidad, rfc, tipo_tramite, scian_id, zone_id,
          tipo_contribuyente, superficie_m2, cuota_vigente, estatus)
         VALUES ($1, $2, 'fisica', $3, 'renovacion', $4, $5, $6, $7, $8, 'activo')`,
        [ejemploId, tp.name, tp.rfc, scianId, zoneId, tipoMap[tp.tipo], tp.sup, tp.cuota],
      );
    }
    console.log(`Seeded ${taxpayers.length} taxpayers for Municipio de Ejemplo`);
  } else {
    console.log('Taxpayers already seeded for Ejemplo');
  }

  // ===========================
  // 8. Central Config Version
  // ===========================
  const centralConfigCount = await dataSource.query(
    `SELECT COUNT(*) as count FROM central_config_versions`,
  );
  if (parseInt(centralConfigCount[0].count, 10) === 0) {
    await dataSource.query(
      `INSERT INTO central_config_versions
       (version, p_superficie_min, p_superficie_max, p_zona_min, p_zona_max,
        p_giro_min, p_giro_max, p_tipo_min, p_tipo_max,
        zona_mult_min, zona_mult_max, variacion_limit_min, variacion_limit_max,
        itd_threshold_protegido, itd_threshold_proporcional, active, justification)
       VALUES (1, 0.2500, 0.4000, 0.2000, 0.3000, 0.1500, 0.2500, 0.1000, 0.2000,
        0.50, 2.00, 0.1000, 0.5000, 0.3300, 0.6600, true, 'Initial central configuration')`,
    );
    console.log('Created initial central config version (v1, active)');
  } else {
    console.log('Central config already seeded');
  }

  // ===========================
  // 9. Audit Logs
  // ===========================
  const systemAdmin = await dataSource.query(
    `SELECT id FROM users WHERE email = 'admin@sdui.gob.mx'`,
  );

  if (systemAdmin.length > 0) {
    const auditCount = await dataSource.query(
      `SELECT COUNT(*) as count FROM audit_logs`,
    );
    if (parseInt(auditCount[0].count, 10) === 0) {
      const adminId = systemAdmin[0].id;
      const sampleAuditEntries = [
        {
          userId: adminId,
          userName: 'Admin Sistema',
          userRole: 'system_admin',
          municipalityId: null,
          action: 'municipality.create',
          module: 'municipalities',
          entityType: 'municipality',
          entityId: ejemploId,
        },
        {
          userId: adminId,
          userName: 'Admin Sistema',
          userRole: 'system_admin',
          municipalityId: null,
          action: 'municipality.create',
          module: 'municipalities',
          entityType: 'municipality',
          entityId: pruebaId,
        },
      ];

      for (const entry of sampleAuditEntries) {
        await dataSource.query(
          `INSERT INTO audit_logs (user_id, user_name, user_role, municipality_id, action, module, entity_type, entity_id, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '{}')`,
          [
            entry.userId,
            entry.userName,
            entry.userRole,
            entry.municipalityId,
            entry.action,
            entry.module,
            entry.entityType,
            entry.entityId,
          ],
        );
      }
      console.log('Created sample audit log entries');
    }
  }

  console.log('\nSeed completed successfully!');
  console.log('\nTest accounts (all passwords: Admin123!):');
  console.log('─────────────────────────────────────────');
  console.log('System Admin:         admin@sdui.gob.mx');
  console.log('Municipal Admin (E):  admin@ejemplo.gob.mx');
  console.log('Treasury (E):         tesoreria@ejemplo.gob.mx');
  console.log('Legal (E):            legal@ejemplo.gob.mx');
  console.log('Comptroller (E):      contralor@ejemplo.gob.mx');
  console.log('Validador (E):        validador@ejemplo.gob.mx');
  console.log('Municipal Admin (P):  admin@prueba.gob.mx');
  console.log('Treasury (P):         tesoreria@prueba.gob.mx');
  console.log('Legal (P):            legal@prueba.gob.mx');
  console.log('Comptroller (P):      contralor@prueba.gob.mx');
  console.log('Validador (P):        validador@prueba.gob.mx');
  console.log('\nMilestone 2 data:');
  console.log('─────────────────');
  console.log('305 SCIAN codes seeded');
  console.log('5 zone types configured for Ejemplo');
  console.log('Weight config: 40/30/20/10, limit 20%, EF 2026');
  console.log('31 taxpayers from Tulancingo test data');
  console.log('\nLogin as admin@ejemplo.gob.mx to test determination engine');

  await dataSource.destroy();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
