import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CentralConfigVersion } from './entities/central-config-version.entity';
import { CentralConfigService } from './central-config.service';
import { CentralConfigController } from './central-config.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CentralConfigVersion]),
    AuditModule,
  ],
  controllers: [CentralConfigController],
  providers: [CentralConfigService],
  exports: [CentralConfigService],
})
export class CentralConfigModule {}
