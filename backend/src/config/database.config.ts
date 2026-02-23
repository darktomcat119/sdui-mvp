import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getDatabaseConfig = (isOwner = false): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  database: process.env.DATABASE_NAME || 'sdui',
  username: isOwner
    ? process.env.DATABASE_OWNER_USER || 'sdui_owner'
    : process.env.DATABASE_USER || 'sdui_app',
  password: isOwner
    ? process.env.DATABASE_OWNER_PASSWORD || 'sdui_dev_password'
    : process.env.DATABASE_PASSWORD || 'sdui_app_password',
  autoLoadEntities: true,
  synchronize: false,
  logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export const getMigrationDataSource = () => ({
  type: 'postgres' as const,
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  database: process.env.DATABASE_NAME || 'sdui',
  username: process.env.DATABASE_OWNER_USER || 'sdui_owner',
  password: process.env.DATABASE_OWNER_PASSWORD || 'sdui_dev_password',
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
});
