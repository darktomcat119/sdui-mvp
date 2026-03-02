import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Determination } from '../determinations/entities/determination.entity';
import { Taxpayer } from '../taxpayers/entities/taxpayer.entity';
import { WeightConfiguration } from '../weights/entities/weight-configuration.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Determination, Taxpayer, WeightConfiguration]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
