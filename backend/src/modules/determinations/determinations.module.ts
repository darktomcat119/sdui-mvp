import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Determination } from './entities/determination.entity';
import { LimitException } from './entities/limit-exception.entity';
import { Taxpayer } from '../taxpayers/entities/taxpayer.entity';
import { WeightConfiguration } from '../weights/entities/weight-configuration.entity';
import { MunicipalityZone } from '../zones/entities/municipality-zone.entity';
import { Municipality } from '../municipalities/entities/municipality.entity';
import { DeterminationsService } from './determinations.service';
import { DeterminationEngineService } from './determination-engine.service';
import { DeterminationsController } from './determinations.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Determination,
      LimitException,
      Taxpayer,
      WeightConfiguration,
      MunicipalityZone,
      Municipality,
    ]),
  ],
  controllers: [DeterminationsController],
  providers: [DeterminationsService, DeterminationEngineService],
  exports: [DeterminationsService],
})
export class DeterminationsModule {}
