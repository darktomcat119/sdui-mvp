import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { Documento } from './entities/document.entity';
import { Determination } from '../determinations/entities/determination.entity';
import { PdfService } from './pdf.service';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../../common/interfaces/jwt-payload.interface';

export const DOCUMENTS_DIR = path.join(process.cwd(), 'uploads', 'documents');

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Documento)
    private readonly documentRepo: Repository<Documento>,
    @InjectRepository(Determination)
    private readonly determRepo: Repository<Determination>,
    private readonly pdfService: PdfService,
    private readonly auditService: AuditService,
  ) {
    // Ensure documents directory exists
    if (!fs.existsSync(DOCUMENTS_DIR)) {
      fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });
    }
  }

  async generateDictamen(
    determinationId: string,
    currentUser: RequestUser,
    sourceIp?: string,
  ): Promise<Documento> {
    const municipalityId = currentUser.municipalityId;
    if (!municipalityId) {
      throw new ForbiddenException('User must belong to a municipality');
    }

    const determination = await this.determRepo.findOne({
      where: { id: determinationId },
      relations: ['taxpayer', 'taxpayer.scian', 'taxpayer.zone', 'weightConfig'],
    });

    if (!determination) {
      throw new NotFoundException('Determination not found');
    }
    if (determination.municipalityId !== municipalityId) {
      throw new NotFoundException('Determination not found');
    }

    // Generate PDF
    const pdfBuffer = await this.pdfService.generateDictamen(determination);

    // Compute SHA-256 hash
    const hashSha256 = crypto
      .createHash('sha256')
      .update(pdfBuffer)
      .digest('hex');

    // Save file to disk
    const filename = `dictamen-${determinationId.slice(0, 8)}-${Date.now()}.pdf`;
    const filePath = path.join(DOCUMENTS_DIR, filename);
    fs.writeFileSync(filePath, pdfBuffer);

    // Save document record
    const doc = this.documentRepo.create({
      municipalityId,
      determinationId,
      tipo: 'dictamen',
      nombreArchivo: filename,
      rutaArchivo: filePath,
      hashSha256,
      tamanoBytes: pdfBuffer.length,
      generadoPor: currentUser.id,
    });

    const saved = await this.documentRepo.save(doc);

    await this.auditService.log({
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      userRole: currentUser.role,
      municipalityId,
      sourceIp,
      action: 'document.generate_dictamen',
      module: 'documents',
      entityType: 'documentos',
      entityId: saved.id,
      dataAfter: {
        determinationId,
        hashSha256,
        tamanoBytes: pdfBuffer.length,
      },
    });

    return saved;
  }

  async findByDetermination(
    determinationId: string,
    currentUser: RequestUser,
  ): Promise<Documento[]> {
    const municipalityId = currentUser.municipalityId;
    const where: any = { determinationId };
    if (municipalityId) {
      where.municipalityId = municipalityId;
    }
    return this.documentRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(
    id: string,
    currentUser: RequestUser,
  ): Promise<Documento> {
    const doc = await this.documentRepo.findOne({
      where: { id },
    });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }
    if (
      currentUser.municipalityId &&
      doc.municipalityId !== currentUser.municipalityId
    ) {
      throw new NotFoundException('Document not found');
    }
    return doc;
  }

  async getFileBuffer(id: string, currentUser: RequestUser): Promise<{ buffer: Buffer; filename: string }> {
    const doc = await this.findOne(id, currentUser);

    if (!fs.existsSync(doc.rutaArchivo)) {
      throw new NotFoundException('Document file not found on disk');
    }

    const buffer = fs.readFileSync(doc.rutaArchivo);
    return { buffer, filename: doc.nombreArchivo };
  }

  async verifyByHash(hash: string): Promise<{
    valid: boolean;
    document?: {
      id: string;
      tipo: string;
      nombreArchivo: string;
      createdAt: Date;
      tamanoBytes: number;
    };
  }> {
    const doc = await this.documentRepo.findOne({
      where: { hashSha256: hash },
    });

    if (!doc) {
      return { valid: false };
    }

    return {
      valid: true,
      document: {
        id: doc.id,
        tipo: doc.tipo,
        nombreArchivo: doc.nombreArchivo,
        createdAt: doc.createdAt,
        tamanoBytes: doc.tamanoBytes,
      },
    };
  }
}
