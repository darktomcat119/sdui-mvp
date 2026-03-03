import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Determination } from './entities/determination.entity';
import { LimitException } from './entities/limit-exception.entity';
import { Taxpayer } from '../taxpayers/entities/taxpayer.entity';
import { WeightConfiguration } from '../weights/entities/weight-configuration.entity';
import { MunicipalityZone } from '../zones/entities/municipality-zone.entity';
import { Municipality } from '../municipalities/entities/municipality.entity';
import {
  DeterminationEngineService,
  SurfaceContext,
} from './determination-engine.service';
import { DeterminationQueryDto, ResolveLimitExceptionDto } from './dto/determinations.dto';
import { PaginatedResponseDto, PaginationDto } from '../../common/dto/pagination.dto';
import { AuditService } from '../audit/audit.service';
import { CentralConfigService } from '../central-config/central-config.service';
import { RequestUser } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class DeterminationsService {
  constructor(
    @InjectRepository(Determination)
    private readonly determRepo: Repository<Determination>,
    @InjectRepository(LimitException)
    private readonly exceptionRepo: Repository<LimitException>,
    @InjectRepository(Taxpayer)
    private readonly taxpayerRepo: Repository<Taxpayer>,
    @InjectRepository(WeightConfiguration)
    private readonly weightRepo: Repository<WeightConfiguration>,
    @InjectRepository(MunicipalityZone)
    private readonly muniZoneRepo: Repository<MunicipalityZone>,
    @InjectRepository(Municipality)
    private readonly municipalityRepo: Repository<Municipality>,
    private readonly engine: DeterminationEngineService,
    private readonly auditService: AuditService,
    private readonly centralConfigService: CentralConfigService,
  ) {}

  private async generateFolio(municipalityId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.exceptionRepo
      .createQueryBuilder('e')
      .where('e.municipalityId = :municipalityId', { municipalityId })
      .andWhere('e.folio LIKE :prefix', { prefix: `EXC-${year}-%` })
      .getCount();
    const seq = (count + 1).toString().padStart(4, '0');
    return `EXC-${year}-${seq}`;
  }

  async execute(
    taxpayerIds: string[] | undefined,
    currentUser: RequestUser,
    sourceIp?: string,
  ): Promise<{ determinations: Determination[]; summary: any }> {
    const municipalityId = currentUser.municipalityId;
    if (!municipalityId) {
      throw new ForbiddenException('User must belong to a municipality');
    }

    // Get municipality's cuota_base_legal
    const municipality = await this.municipalityRepo.findOne({
      where: { id: municipalityId },
    });
    if (!municipality?.cuotaBaseLegal) {
      throw new BadRequestException(
        'Municipality must have cuota_base_legal configured before executing determinations.',
      );
    }
    const cuotaBaseLegal = Number(municipality.cuotaBaseLegal);

    // Get active weight config
    const weightConfig = await this.weightRepo.findOne({
      where: { municipalityId },
      order: { ejercicioFiscal: 'DESC', createdAt: 'DESC' },
    });
    if (!weightConfig) {
      throw new BadRequestException(
        'No weight configuration found. Please configure weights before executing determinations.',
      );
    }

    // Get taxpayers
    let taxpayers: Taxpayer[];
    if (taxpayerIds && taxpayerIds.length > 0) {
      taxpayers = await this.taxpayerRepo.find({
        where: { id: In(taxpayerIds), municipalityId, estatus: 'activo' },
        relations: ['scian', 'zone'],
      });
      if (taxpayers.length === 0) {
        throw new BadRequestException('No active taxpayers found with the specified IDs');
      }
    } else {
      taxpayers = await this.taxpayerRepo.find({
        where: { municipalityId, estatus: 'activo' },
        relations: ['scian', 'zone'],
      });
      if (taxpayers.length === 0) {
        throw new BadRequestException('No active taxpayers found in this municipality');
      }
    }

    // Compute surface context (min/max m² for normalization)
    const allActiveTaxpayers = await this.taxpayerRepo.find({
      where: { municipalityId, estatus: 'activo' },
      select: ['superficieM2'],
    });
    const surfaces = allActiveTaxpayers.map((t) => Number(t.superficieM2));
    const surfaceContext: SurfaceContext = {
      minM2: Math.min(...surfaces),
      maxM2: Math.max(...surfaces),
    };

    // Load active central config for thresholds and zone normalization bounds
    const centralConfig = await this.centralConfigService.getActive();
    const thresholds = centralConfig
      ? {
          protegido: Number(centralConfig.itdThresholdProtegido),
          proporcional: Number(centralConfig.itdThresholdProporcional),
        }
      : undefined;
    const zoneNormBounds = centralConfig
      ? {
          min: Number(centralConfig.zonaMultMin),
          max: Number(centralConfig.zonaMultMax),
        }
      : undefined;

    // Load municipality zone configs
    const muniZones = await this.muniZoneRepo.find({
      where: { municipalityId },
    });
    const zoneMultMap = new Map<string, number>();
    for (const mz of muniZones) {
      zoneMultMap.set(mz.zoneId, Number(mz.multiplicador));
    }

    // Delete previous non-approved determinations for same fiscal year
    const approvedCount = await this.determRepo.count({
      where: {
        municipalityId,
        ejercicioFiscal: weightConfig.ejercicioFiscal,
        estatus: 'aprobada',
      },
    });
    if (approvedCount > 0) {
      throw new BadRequestException(
        'Cannot re-execute: approved determinations exist for this fiscal year. Reset them first.',
      );
    }
    await this.determRepo.delete({
      municipalityId,
      ejercicioFiscal: weightConfig.ejercicioFiscal,
    });

    const determinations: Determination[] = [];
    const limitePct = Number(weightConfig.limiteVariacionPct);

    for (const taxpayer of taxpayers) {
      const multiplicador = zoneMultMap.get(taxpayer.zoneId) ?? 1.0;

      const result = this.engine.calculate(
        taxpayer,
        weightConfig,
        surfaceContext,
        multiplicador,
        cuotaBaseLegal,
        thresholds,
        zoneNormBounds,
      );

      // Determine status based on limit check
      let estatus = 'calculada';
      if (result.variacionPct > limitePct) {
        estatus = 'bloqueada';
      }

      const determ = this.determRepo.create({
        municipalityId,
        taxpayerId: taxpayer.id,
        weightConfigId: weightConfig.id,
        ejercicioFiscal: weightConfig.ejercicioFiscal,
        configVersionId: centralConfig?.id || null,
        vSuperficie: result.vSuperficie,
        vZona: result.vZona,
        vGiro: result.vGiro,
        vTipo: result.vTipo,
        pSuperficie: Number(weightConfig.pSuperficie),
        pZona: Number(weightConfig.pZona),
        pGiro: Number(weightConfig.pGiro),
        pTipo: Number(weightConfig.pTipo),
        itd: result.itd,
        clasificacion: result.clasificacion,
        cuotaVigente: Number(taxpayer.cuotaVigente),
        cuotaBaseLegal: result.cuotaBaseLegal,
        cuotaSdui: result.cuotaSdui,
        variacionPct: result.variacionPct,
        limitePctAplicado: limitePct,
        estatus,
      });

      const saved = await this.determRepo.save(determ);

      // Create limit exception if blocked, with folio
      if (estatus === 'bloqueada') {
        const folio = await this.generateFolio(municipalityId);
        const exception = this.exceptionRepo.create({
          determinationId: saved.id,
          municipalityId,
          valorPropuesto: result.cuotaSdui,
          limitePct,
          motivo: `Variation ${(result.variacionPct * 100).toFixed(2)}% exceeds limit ${(limitePct * 100).toFixed(2)}%`,
          folio,
          estatus: 'pendiente',
        });
        await this.exceptionRepo.save(exception);
      }

      determinations.push(saved);
    }

    // Build summary
    const summary = {
      total: determinations.length,
      protegido: determinations.filter((d) => d.clasificacion === 'protegido').length,
      moderado: determinations.filter((d) => d.clasificacion === 'moderado').length,
      proporcional: determinations.filter((d) => d.clasificacion === 'proporcional').length,
      bloqueadas: determinations.filter((d) => d.estatus === 'bloqueada').length,
    };

    await this.auditService.log({
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      userRole: currentUser.role,
      municipalityId,
      sourceIp,
      action: 'determination.execute',
      module: 'determinations',
      entityType: 'determinations',
      dataAfter: {
        ejercicioFiscal: weightConfig.ejercicioFiscal,
        ...summary,
      },
    });

    return { determinations, summary };
  }

  async findAll(
    query: DeterminationQueryDto,
    currentUser: RequestUser,
  ): Promise<PaginatedResponseDto<Determination>> {
    const municipalityId = currentUser.municipalityId;
    const page = query.page || 1;
    const limit = query.limit || 20;

    const qb = this.determRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.taxpayer', 'taxpayer')
      .leftJoinAndSelect('taxpayer.scian', 'scian')
      .leftJoinAndSelect('taxpayer.zone', 'zone');

    if (municipalityId) {
      qb.andWhere('d.municipalityId = :municipalityId', { municipalityId });
    }
    if (query.clasificacion) {
      qb.andWhere('d.clasificacion = :clasificacion', {
        clasificacion: query.clasificacion,
      });
    }
    if (query.estatus) {
      qb.andWhere('d.estatus = :estatus', { estatus: query.estatus });
    }
    if (query.search) {
      qb.andWhere('taxpayer.razonSocial ILIKE :search', {
        search: `%${query.search}%`,
      });
    }

    qb.orderBy('d.itd', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOne(id: string, currentUser: RequestUser): Promise<Determination> {
    const determ = await this.determRepo.findOne({
      where: { id },
      relations: ['taxpayer', 'taxpayer.scian', 'taxpayer.zone', 'weightConfig'],
    });
    if (!determ) {
      throw new NotFoundException('Determination not found');
    }
    if (
      currentUser.municipalityId &&
      determ.municipalityId !== currentUser.municipalityId
    ) {
      throw new NotFoundException('Determination not found');
    }
    return determ;
  }

  async getSummary(currentUser: RequestUser): Promise<any> {
    const municipalityId = currentUser.municipalityId;
    if (!municipalityId) {
      throw new ForbiddenException('User must belong to a municipality');
    }

    const qb = this.determRepo
      .createQueryBuilder('d')
      .where('d.municipalityId = :municipalityId', { municipalityId });

    const total = await qb.getCount();

    const byClasificacion = await this.determRepo
      .createQueryBuilder('d')
      .select('d.clasificacion', 'clasificacion')
      .addSelect('COUNT(*)', 'count')
      .where('d.municipalityId = :municipalityId', { municipalityId })
      .groupBy('d.clasificacion')
      .getRawMany();

    const byEstatus = await this.determRepo
      .createQueryBuilder('d')
      .select('d.estatus', 'estatus')
      .addSelect('COUNT(*)', 'count')
      .where('d.municipalityId = :municipalityId', { municipalityId })
      .groupBy('d.estatus')
      .getRawMany();

    const avgImpact = await this.determRepo
      .createQueryBuilder('d')
      .select('AVG(d.variacionPct)', 'avg')
      .addSelect('MAX(d.variacionPct)', 'max')
      .where('d.municipalityId = :municipalityId', { municipalityId })
      .getRawOne();

    return {
      total,
      byClasificacion,
      byEstatus,
      promedioImpacto: parseFloat(avgImpact?.avg) || 0,
      impactoMaximo: parseFloat(avgImpact?.max) || 0,
    };
  }

  async approve(
    id: string,
    currentUser: RequestUser,
    sourceIp?: string,
  ): Promise<Determination> {
    const determ = await this.findOne(id, currentUser);
    if (determ.estatus !== 'calculada') {
      throw new BadRequestException(
        `Cannot approve determination with status "${determ.estatus}"`,
      );
    }

    determ.estatus = 'aprobada';
    const saved = await this.determRepo.save(determ);

    await this.auditService.log({
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      userRole: currentUser.role,
      municipalityId: currentUser.municipalityId,
      sourceIp,
      action: 'determination.approve',
      module: 'determinations',
      entityType: 'determinations',
      entityId: id,
      dataBefore: { estatus: 'calculada' },
      dataAfter: { estatus: 'aprobada' },
    });

    return saved;
  }

  async findExceptions(
    currentUser: RequestUser,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<LimitException>> {
    const municipalityId = currentUser.municipalityId;
    if (!municipalityId) {
      throw new ForbiddenException('User must belong to a municipality');
    }

    const page = pagination.page || 1;
    const limit = pagination.limit || 20;

    const [data, total] = await this.exceptionRepo.findAndCount({
      where: { municipalityId },
      relations: ['determination', 'determination.taxpayer'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async resolveException(
    id: string,
    dto: ResolveLimitExceptionDto,
    currentUser: RequestUser,
    sourceIp?: string,
  ): Promise<LimitException> {
    const exception = await this.exceptionRepo.findOne({
      where: { id, municipalityId: currentUser.municipalityId! },
      relations: ['determination'],
    });
    if (!exception) {
      throw new NotFoundException('Exception not found');
    }
    if (exception.estatus !== 'pendiente') {
      throw new BadRequestException('Exception already resolved');
    }

    // Map resolution option to status
    let newEstatus: string;
    if (dto.resolutionOption === 'APROBAR') {
      newEstatus = 'aprobada';
    } else if (dto.resolutionOption === 'RECHAZAR') {
      newEstatus = 'rechazada';
    } else {
      newEstatus = 'escalada';
    }

    exception.estatus = newEstatus;
    exception.resolutionOption = dto.resolutionOption;
    exception.justificacionResolucion = dto.justificacion;
    exception.aprobadoPor = currentUser.id;
    exception.fechaResolucion = new Date();

    if (dto.resolutionOption === 'ESCALAR' && dto.escalatedTo) {
      exception.escalatedTo = dto.escalatedTo;
    }

    const saved = await this.exceptionRepo.save(exception);

    // Update determination status
    if (exception.determination) {
      if (newEstatus === 'aprobada') {
        exception.determination.estatus = 'aprobada';
      } else if (newEstatus === 'rechazada') {
        exception.determination.estatus = 'bloqueada';
      }
      // For 'escalada', keep determination as bloqueada
      await this.determRepo.save(exception.determination);
    }

    await this.auditService.log({
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      userRole: currentUser.role,
      municipalityId: currentUser.municipalityId,
      sourceIp,
      action: 'determination.resolve_exception',
      module: 'determinations',
      entityType: 'limit_exceptions',
      entityId: id,
      dataBefore: { estatus: 'pendiente' },
      dataAfter: {
        estatus: newEstatus,
        resolutionOption: dto.resolutionOption,
        folio: exception.folio,
      },
    });

    return saved;
  }
}
