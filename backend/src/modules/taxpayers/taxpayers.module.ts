import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Taxpayer } from './entities/taxpayer.entity';
import { ScianCatalog } from '../scian/entities/scian-catalog.entity';
import { ZoneCatalog } from '../zones/entities/zone-catalog.entity';
import { TaxpayersService } from './taxpayers.service';
import { TaxpayersController } from './taxpayers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Taxpayer, ScianCatalog, ZoneCatalog])],
  controllers: [TaxpayersController],
  providers: [TaxpayersService],
  exports: [TaxpayersService],
})
export class TaxpayersModule {}
