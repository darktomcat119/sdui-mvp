import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WeightConfiguration } from './entities/weight-configuration.entity';
import { WeightsService } from './weights.service';
import { WeightsController } from './weights.controller';
import { CentralConfigModule } from '../central-config/central-config.module';

@Module({
  imports: [TypeOrmModule.forFeature([WeightConfiguration]), CentralConfigModule],
  controllers: [WeightsController],
  providers: [WeightsService],
  exports: [WeightsService],
})
export class WeightsModule {}
