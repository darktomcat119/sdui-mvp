import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZoneCatalog } from './entities/zone-catalog.entity';
import { MunicipalityZone } from './entities/municipality-zone.entity';
import { ZonesService } from './zones.service';
import { ZonesController } from './zones.controller';
import { CentralConfigModule } from '../central-config/central-config.module';

@Module({
  imports: [TypeOrmModule.forFeature([ZoneCatalog, MunicipalityZone]), CentralConfigModule],
  controllers: [ZonesController],
  providers: [ZonesService],
  exports: [ZonesService],
})
export class ZonesModule {}
