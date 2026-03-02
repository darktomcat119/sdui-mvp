import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { WeightConfiguration } from './entities/weight-configuration.entity';
import { CreateWeightConfigDto } from './dto/weights.dto';
import { PaginatedResponseDto, PaginationDto } from '../../common/dto/pagination.dto';
import { AuditService } from '../audit/audit.service';
import { CentralConfigService } from '../central-config/central-config.service';
import { RequestUser } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class WeightsService {
  constructor(
    @InjectRepository(WeightConfiguration)
    private readonly weightRepo: Repository<WeightConfiguration>,
    private readonly auditService: AuditService,
    private readonly centralConfigService: CentralConfigService,
  ) {}

  async findCurrent(currentUser: RequestUser): Promise<WeightConfiguration> {
    const municipalityId = currentUser.municipalityId;
    if (!municipalityId) {
      throw new ForbiddenException('User must belong to a municipality');
    }

    const config = await this.weightRepo.findOne({
      where: { municipalityId, vigenciaHasta: IsNull() },
      order: { ejercicioFiscal: 'DESC' },
    });

    if (!config) {
      throw new NotFoundException(
        'No active weight configuration found for this municipality',
      );
    }

    return config;
  }

  async findCurrentByMunicipality(
    municipalityId: string,
  ): Promise<WeightConfiguration | null> {
    return this.weightRepo.findOne({
      where: { municipalityId, vigenciaHasta: IsNull() },
      order: { ejercicioFiscal: 'DESC' },
    });
  }

  async findByMunicipalityAndFiscalYear(
    municipalityId: string,
    ejercicioFiscal: number,
  ): Promise<WeightConfiguration | null> {
    return this.weightRepo.findOne({
      where: { municipalityId, ejercicioFiscal },
    });
  }

  async findHistory(
    currentUser: RequestUser,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<WeightConfiguration>> {
    const municipalityId = currentUser.municipalityId;
    if (!municipalityId) {
      throw new ForbiddenException('User must belong to a municipality');
    }

    const page = pagination.page || 1;
    const limit = pagination.limit || 20;

    const [data, total] = await this.weightRepo.findAndCount({
      where: { municipalityId },
      order: { ejercicioFiscal: 'DESC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async create(
    dto: CreateWeightConfigDto,
    currentUser: RequestUser,
    sourceIp?: string,
  ): Promise<WeightConfiguration> {
    const municipalityId = currentUser.municipalityId;
    if (!municipalityId) {
      throw new ForbiddenException('User must belong to a municipality');
    }

    // Validate weight sum
    const sum =
      Number(dto.pSuperficie) +
      Number(dto.pZona) +
      Number(dto.pGiro) +
      Number(dto.pTipo);
    if (Math.abs(sum - 1.0) > 0.0001) {
      throw new BadRequestException(
        `Weight sum must equal 1.0 (got ${sum.toFixed(4)})`,
      );
    }

    // Validate against central config ranges
    const centralConfig = await this.centralConfigService.getActive();
    if (centralConfig) {
      const violations: string[] = [];
      if (dto.pSuperficie < Number(centralConfig.pSuperficieMin) || dto.pSuperficie > Number(centralConfig.pSuperficieMax)) {
        violations.push(`pSuperficie (${dto.pSuperficie}) must be between ${centralConfig.pSuperficieMin} and ${centralConfig.pSuperficieMax}`);
      }
      if (dto.pZona < Number(centralConfig.pZonaMin) || dto.pZona > Number(centralConfig.pZonaMax)) {
        violations.push(`pZona (${dto.pZona}) must be between ${centralConfig.pZonaMin} and ${centralConfig.pZonaMax}`);
      }
      if (dto.pGiro < Number(centralConfig.pGiroMin) || dto.pGiro > Number(centralConfig.pGiroMax)) {
        violations.push(`pGiro (${dto.pGiro}) must be between ${centralConfig.pGiroMin} and ${centralConfig.pGiroMax}`);
      }
      if (dto.pTipo < Number(centralConfig.pTipoMin) || dto.pTipo > Number(centralConfig.pTipoMax)) {
        violations.push(`pTipo (${dto.pTipo}) must be between ${centralConfig.pTipoMin} and ${centralConfig.pTipoMax}`);
      }
      if (dto.limiteVariacionPct < Number(centralConfig.variacionLimitMin) || dto.limiteVariacionPct > Number(centralConfig.variacionLimitMax)) {
        violations.push(`limiteVariacionPct (${dto.limiteVariacionPct}) must be between ${centralConfig.variacionLimitMin} and ${centralConfig.variacionLimitMax}`);
      }
      if (violations.length > 0) {
        await this.auditService.log({
          userId: currentUser.id,
          userName: `${currentUser.firstName} ${currentUser.lastName}`,
          userRole: currentUser.role,
          municipalityId,
          sourceIp,
          action: 'weights.out_of_range_attempt',
          module: 'weights',
          entityType: 'weight_configurations',
          entityId: null,
          dataAfter: { violations, dto },
        });
        throw new BadRequestException(`Values outside allowed central config ranges: ${violations.join('; ')}`);
      }
    }

    // Check if config already exists for this fiscal year
    const existing = await this.weightRepo.findOne({
      where: { municipalityId, ejercicioFiscal: dto.ejercicioFiscal },
    });
    if (existing) {
      throw new BadRequestException(
        `Weight configuration already exists for fiscal year ${dto.ejercicioFiscal}. Only one configuration per fiscal year is allowed.`,
      );
    }

    // Close any previous active config
    const previousActive = await this.weightRepo.findOne({
      where: { municipalityId, vigenciaHasta: IsNull() },
      order: { ejercicioFiscal: 'DESC' },
    });
    if (previousActive) {
      previousActive.vigenciaHasta = new Date(dto.vigenciaDesde);
      await this.weightRepo.save(previousActive);
    }

    const config = this.weightRepo.create({
      municipalityId,
      pSuperficie: dto.pSuperficie,
      pZona: dto.pZona,
      pGiro: dto.pGiro,
      pTipo: dto.pTipo,
      limiteVariacionPct: dto.limiteVariacionPct,
      ejercicioFiscal: dto.ejercicioFiscal,
      vigenciaDesde: new Date(dto.vigenciaDesde),
      justificacion: dto.justificacion || null,
      folioActa: dto.folioActa || null,
    });

    const saved = await this.weightRepo.save(config);

    await this.auditService.log({
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      userRole: currentUser.role,
      municipalityId,
      sourceIp,
      action: 'weights.create',
      module: 'weights',
      entityType: 'weight_configurations',
      entityId: saved.id,
      dataAfter: {
        pSuperficie: dto.pSuperficie,
        pZona: dto.pZona,
        pGiro: dto.pGiro,
        pTipo: dto.pTipo,
        limiteVariacionPct: dto.limiteVariacionPct,
        ejercicioFiscal: dto.ejercicioFiscal,
      },
    });

    return saved;
  }
}
