import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Documento } from './entities/document.entity';
import { Determination } from '../determinations/entities/determination.entity';
import { DocumentsService } from './documents.service';
import { PdfService } from './pdf.service';
import { DocumentsController } from './documents.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Documento, Determination]),
    AuditModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, PdfService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
