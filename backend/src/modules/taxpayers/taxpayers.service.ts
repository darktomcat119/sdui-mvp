import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Taxpayer } from './entities/taxpayer.entity';
import {
  CreateTaxpayerDto,
  UpdateTaxpayerDto,
  TaxpayerQueryDto,
} from './dto/taxpayers.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../../common/interfaces/jwt-payload.interface';
import { UserRole } from '../../common/constants/roles.constant';
import { ScianCatalog } from '../scian/entities/scian-catalog.entity';
import { ZoneCatalog } from '../zones/entities/zone-catalog.entity';

export interface BulkUploadResult {
  total: number;
  created: number;
  errors: { row: number; field: string; message: string }[];
}

@Injectable()
export class TaxpayersService {
  constructor(
    @InjectRepository(Taxpayer)
    private readonly taxpayerRepo: Repository<Taxpayer>,
    @InjectRepository(ScianCatalog)
    private readonly scianRepo: Repository<ScianCatalog>,
    @InjectRepository(ZoneCatalog)
    private readonly zoneRepo: Repository<ZoneCatalog>,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  async findAll(
    query: TaxpayerQueryDto,
    currentUser: RequestUser,
  ): Promise<PaginatedResponseDto<Taxpayer>> {
    const municipalityId =
      currentUser.role === UserRole.SYSTEM_ADMIN
        ? null
        : currentUser.municipalityId;
    const page = query.page || 1;
    const limit = query.limit || 20;

    const qb = this.taxpayerRepo
      .createQueryBuilder('tp')
      .leftJoinAndSelect('tp.scian', 'scian')
      .leftJoinAndSelect('tp.zone', 'zone');

    if (municipalityId) {
      qb.andWhere('tp.municipalityId = :municipalityId', { municipalityId });
    }
    if (query.search) {
      qb.andWhere(
        '(tp.razonSocial ILIKE :search OR tp.rfc ILIKE :search OR tp.numeroLicencia ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }
    if (query.scianId) {
      qb.andWhere('tp.scianId = :scianId', { scianId: query.scianId });
    }
    if (query.zoneId) {
      qb.andWhere('tp.zoneId = :zoneId', { zoneId: query.zoneId });
    }
    if (query.tipoContribuyente) {
      qb.andWhere('tp.tipoContribuyente = :tipoContribuyente', {
        tipoContribuyente: query.tipoContribuyente,
      });
    }
    if (query.estatus) {
      qb.andWhere('tp.estatus = :estatus', { estatus: query.estatus });
    }

    qb.orderBy('tp.razonSocial', 'ASC');
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOne(id: string, currentUser: RequestUser): Promise<Taxpayer> {
    const tp = await this.taxpayerRepo.findOne({
      where: { id },
      relations: ['scian', 'zone'],
    });
    if (!tp) {
      throw new NotFoundException('Taxpayer not found');
    }
    if (
      currentUser.role !== UserRole.SYSTEM_ADMIN &&
      tp.municipalityId !== currentUser.municipalityId
    ) {
      throw new NotFoundException('Taxpayer not found');
    }
    return tp;
  }

  async create(
    dto: CreateTaxpayerDto,
    currentUser: RequestUser,
    sourceIp?: string,
  ): Promise<Taxpayer> {
    const municipalityId = currentUser.municipalityId;
    if (!municipalityId) {
      throw new ForbiddenException('User must belong to a municipality');
    }

    // Validate SCIAN exists
    const scian = await this.scianRepo.findOne({ where: { id: dto.scianId } });
    if (!scian) {
      throw new BadRequestException('Invalid SCIAN code');
    }

    // Validate zone exists
    const zone = await this.zoneRepo.findOne({ where: { id: dto.zoneId } });
    if (!zone) {
      throw new BadRequestException('Invalid zone');
    }

    const taxpayer = this.taxpayerRepo.create({
      ...dto,
      municipalityId,
      rfc: dto.rfc || null,
      curp: dto.curp || null,
      numeroLicencia: dto.numeroLicencia || null,
      claveCatastral: dto.claveCatastral || null,
      usoSuelo: dto.usoSuelo || null,
      actividadRegulada: dto.actividadRegulada || null,
    });

    const saved = await this.taxpayerRepo.save(taxpayer);

    await this.auditService.log({
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      userRole: currentUser.role,
      municipalityId,
      sourceIp,
      action: 'taxpayer.create',
      module: 'taxpayers',
      entityType: 'taxpayers',
      entityId: saved.id,
      dataAfter: { razonSocial: dto.razonSocial, rfc: dto.rfc },
    });

    return saved;
  }

  async update(
    id: string,
    dto: UpdateTaxpayerDto,
    currentUser: RequestUser,
    sourceIp?: string,
  ): Promise<Taxpayer> {
    const taxpayer = await this.findOne(id, currentUser);
    const before = {
      razonSocial: taxpayer.razonSocial,
      superficieM2: taxpayer.superficieM2,
      cuotaVigente: taxpayer.cuotaVigente,
      estatus: taxpayer.estatus,
    };

    Object.assign(taxpayer, dto);
    const saved = await this.taxpayerRepo.save(taxpayer);

    await this.auditService.log({
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      userRole: currentUser.role,
      municipalityId: currentUser.municipalityId,
      sourceIp,
      action: 'taxpayer.update',
      module: 'taxpayers',
      entityType: 'taxpayers',
      entityId: id,
      dataBefore: before,
      dataAfter: dto,
    });

    return saved;
  }

  async bulkUpload(
    csvContent: string,
    currentUser: RequestUser,
    sourceIp?: string,
  ): Promise<BulkUploadResult> {
    const municipalityId = currentUser.municipalityId;
    if (!municipalityId) {
      throw new ForbiddenException('User must belong to a municipality');
    }

    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      throw new BadRequestException('CSV file must have a header row and at least one data row');
    }

    const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const requiredColumns = [
      'razon_social',
      'tipo_personalidad',
      'tipo_tramite',
      'codigo_scian',
      'codigo_zona',
      'tipo_contribuyente',
      'superficie_m2',
      'cuota_vigente',
    ];

    for (const col of requiredColumns) {
      if (!header.includes(col)) {
        throw new BadRequestException(`Missing required column: ${col}`);
      }
    }

    // Pre-load SCIAN and zone lookups
    const scianList = await this.scianRepo.find();
    const scianMap = new Map(scianList.map((s) => [s.codigoScian, s]));

    const zoneList = await this.zoneRepo.find();
    const zoneMap = new Map(zoneList.map((z) => [z.codigoZona, z]));

    const errors: { row: number; field: string; message: string }[] = [];
    const taxpayers: Partial<Taxpayer>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      const row: Record<string, string> = {};
      header.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });

      // Validate SCIAN
      const scian = scianMap.get(row.codigo_scian);
      if (!scian) {
        errors.push({
          row: i + 1,
          field: 'codigo_scian',
          message: `SCIAN code "${row.codigo_scian}" not found`,
        });
        continue;
      }

      // Validate zone
      const zone = zoneMap.get(row.codigo_zona);
      if (!zone) {
        errors.push({
          row: i + 1,
          field: 'codigo_zona',
          message: `Zone code "${row.codigo_zona}" not found`,
        });
        continue;
      }

      // Validate tipo_personalidad
      if (!['fisica', 'moral'].includes(row.tipo_personalidad)) {
        errors.push({
          row: i + 1,
          field: 'tipo_personalidad',
          message: `Invalid tipo_personalidad: "${row.tipo_personalidad}"`,
        });
        continue;
      }

      // Validate tipo_tramite
      if (!['apertura', 'renovacion'].includes(row.tipo_tramite)) {
        errors.push({
          row: i + 1,
          field: 'tipo_tramite',
          message: `Invalid tipo_tramite: "${row.tipo_tramite}"`,
        });
        continue;
      }

      // Validate tipo_contribuyente
      if (
        !['independiente', 'franquicia', 'cadena'].includes(
          row.tipo_contribuyente,
        )
      ) {
        errors.push({
          row: i + 1,
          field: 'tipo_contribuyente',
          message: `Invalid tipo_contribuyente: "${row.tipo_contribuyente}"`,
        });
        continue;
      }

      const superficie = parseFloat(row.superficie_m2);
      if (isNaN(superficie) || superficie <= 0) {
        errors.push({
          row: i + 1,
          field: 'superficie_m2',
          message: `Invalid superficie_m2: "${row.superficie_m2}"`,
        });
        continue;
      }

      const cuota = parseFloat(row.cuota_vigente);
      if (isNaN(cuota) || cuota < 0) {
        errors.push({
          row: i + 1,
          field: 'cuota_vigente',
          message: `Invalid cuota_vigente: "${row.cuota_vigente}"`,
        });
        continue;
      }

      taxpayers.push({
        municipalityId,
        razonSocial: row.razon_social,
        tipoPersonalidad: row.tipo_personalidad,
        rfc: row.rfc || null,
        curp: row.curp || null,
        tipoTramite: row.tipo_tramite,
        numeroLicencia: row.numero_licencia || null,
        claveCatastral: row.clave_catastral || null,
        usoSuelo: row.uso_suelo || null,
        actividadRegulada: row.actividad_regulada || null,
        scianId: scian.id,
        zoneId: zone.id,
        tipoContribuyente: row.tipo_contribuyente,
        superficieM2: superficie,
        cuotaVigente: cuota,
      });
    }

    if (errors.length > 0 && taxpayers.length === 0) {
      return { total: lines.length - 1, created: 0, errors };
    }

    // Transactional insert
    let created = 0;
    if (taxpayers.length > 0) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        for (const tp of taxpayers) {
          const entity = this.taxpayerRepo.create(tp);
          await queryRunner.manager.save(entity);
          created++;
        }
        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw new BadRequestException(
          `Bulk upload failed during insert: ${error.message}`,
        );
      } finally {
        await queryRunner.release();
      }
    }

    await this.auditService.log({
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      userRole: currentUser.role,
      municipalityId,
      sourceIp,
      action: 'taxpayer.bulk_upload',
      module: 'taxpayers',
      entityType: 'taxpayers',
      dataAfter: {
        totalRows: lines.length - 1,
        created,
        errorsCount: errors.length,
      },
    });

    return { total: lines.length - 1, created, errors };
  }

  async getStats(currentUser: RequestUser): Promise<any> {
    const municipalityId = currentUser.municipalityId;
    if (!municipalityId) {
      throw new ForbiddenException('User must belong to a municipality');
    }

    const qb = this.taxpayerRepo
      .createQueryBuilder('tp')
      .where('tp.municipalityId = :municipalityId', { municipalityId });

    const total = await qb.getCount();

    const byTipo = await this.taxpayerRepo
      .createQueryBuilder('tp')
      .select('tp.tipoContribuyente', 'tipo')
      .addSelect('COUNT(*)', 'count')
      .where('tp.municipalityId = :municipalityId', { municipalityId })
      .andWhere('tp.estatus = :estatus', { estatus: 'activo' })
      .groupBy('tp.tipoContribuyente')
      .getRawMany();

    const byEstatus = await this.taxpayerRepo
      .createQueryBuilder('tp')
      .select('tp.estatus', 'estatus')
      .addSelect('COUNT(*)', 'count')
      .where('tp.municipalityId = :municipalityId', { municipalityId })
      .groupBy('tp.estatus')
      .getRawMany();

    const surfaceStats = await this.taxpayerRepo
      .createQueryBuilder('tp')
      .select('MIN(tp.superficieM2)', 'min')
      .addSelect('MAX(tp.superficieM2)', 'max')
      .addSelect('AVG(tp.superficieM2)', 'avg')
      .where('tp.municipalityId = :municipalityId', { municipalityId })
      .andWhere('tp.estatus = :estatus', { estatus: 'activo' })
      .getRawOne();

    return {
      total,
      byTipo,
      byEstatus,
      surfaceStats: {
        min: parseFloat(surfaceStats?.min) || 0,
        max: parseFloat(surfaceStats?.max) || 0,
        avg: parseFloat(surfaceStats?.avg) || 0,
      },
    };
  }
}
