import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { getDatabaseConfig } from './config/database.config';
import { RlsInterceptor } from './common/interceptors/rls.interceptor';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MunicipalitiesModule } from './modules/municipalities/municipalities.module';
import { AuditModule } from './modules/audit/audit.module';
import { HealthModule } from './modules/health/health.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { ScianModule } from './modules/scian/scian.module';
import { ZonesModule } from './modules/zones/zones.module';
import { WeightsModule } from './modules/weights/weights.module';
import { TaxpayersModule } from './modules/taxpayers/taxpayers.module';
import { DeterminationsModule } from './modules/determinations/determinations.module';
import { ReportsModule } from './modules/reports/reports.module';
import { CentralConfigModule } from './modules/central-config/central-config.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(getDatabaseConfig()),
    AuthModule,
    UsersModule,
    MunicipalitiesModule,
    AuditModule,
    HealthModule,
    UploadsModule,
    ScianModule,
    ZonesModule,
    WeightsModule,
    TaxpayersModule,
    DeterminationsModule,
    ReportsModule,
    CentralConfigModule,
    DocumentsModule,
    NotificationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RlsInterceptor,
    },
  ],
})
export class AppModule {}
