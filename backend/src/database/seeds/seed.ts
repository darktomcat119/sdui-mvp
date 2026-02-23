import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

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

  // Seed municipalities
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

  // Define seed users
  const seedUsers = [
    // System admin (no municipality)
    {
      email: 'admin@sdui.gob.mx',
      firstName: 'Admin',
      lastName: 'Sistema',
      role: 'system_admin',
      municipalityId: null,
    },
    // Ejemplo municipality
    {
      email: 'admin@ejemplo.gob.mx',
      firstName: 'Carlos',
      lastName: 'Martinez',
      role: 'municipal_admin',
      municipalityId: ejemploId,
    },
    {
      email: 'tesoreria@ejemplo.gob.mx',
      firstName: 'Maria',
      lastName: 'Lopez',
      role: 'treasury_operator',
      municipalityId: ejemploId,
    },
    {
      email: 'legal@ejemplo.gob.mx',
      firstName: 'Roberto',
      lastName: 'Garcia',
      role: 'legal_analyst',
      municipalityId: ejemploId,
    },
    {
      email: 'contralor@ejemplo.gob.mx',
      firstName: 'Ana',
      lastName: 'Hernandez',
      role: 'comptroller_auditor',
      municipalityId: ejemploId,
    },
    // Prueba municipality
    {
      email: 'admin@prueba.gob.mx',
      firstName: 'Fernando',
      lastName: 'Rodriguez',
      role: 'municipal_admin',
      municipalityId: pruebaId,
    },
    {
      email: 'tesoreria@prueba.gob.mx',
      firstName: 'Laura',
      lastName: 'Sanchez',
      role: 'treasury_operator',
      municipalityId: pruebaId,
    },
    {
      email: 'legal@prueba.gob.mx',
      firstName: 'Jorge',
      lastName: 'Torres',
      role: 'legal_analyst',
      municipalityId: pruebaId,
    },
    {
      email: 'contralor@prueba.gob.mx',
      firstName: 'Patricia',
      lastName: 'Flores',
      role: 'comptroller_auditor',
      municipalityId: pruebaId,
    },
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
        [
          user.email,
          passwordHash,
          user.firstName,
          user.lastName,
          user.role,
          user.municipalityId,
        ],
      );
      console.log(`Created user: ${user.email} (${user.role})`);
    } else {
      console.log(`User ${user.email} already exists`);
    }
  }

  // Seed sample audit log entries
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
  console.log('Municipal Admin (P):  admin@prueba.gob.mx');
  console.log('Treasury (P):         tesoreria@prueba.gob.mx');
  console.log('Legal (P):            legal@prueba.gob.mx');
  console.log('Comptroller (P):      contralor@prueba.gob.mx');

  await dataSource.destroy();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
