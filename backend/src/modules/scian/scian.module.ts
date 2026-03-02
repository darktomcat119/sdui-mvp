import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScianCatalog } from './entities/scian-catalog.entity';
import { MunicipalityScian } from './entities/municipality-scian.entity';
import { ScianService } from './scian.service';
import { ScianController } from './scian.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ScianCatalog, MunicipalityScian])],
  controllers: [ScianController],
  providers: [ScianService],
  exports: [ScianService],
})
export class ScianModule {}
