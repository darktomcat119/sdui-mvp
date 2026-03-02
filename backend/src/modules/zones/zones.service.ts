import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ZoneCatalog } from './entities/zone-catalog.entity';
import { MunicipalityZone } from './entities/municipality-zone.entity';
import {
  CreateZoneDto,
  ConfigureMunicipalityZoneDto,
  UpdateMunicipalityZoneDto,
  ZoneQueryDto,
} from './dto/zones.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { AuditService } from '../audit/audit.service';
import { CentralConfigService } from '../central-config/central-config.service';
import { RequestUser } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class ZonesService {
  constructor(
    @InjectRepository(ZoneCatalog)
    private readonly zoneCatalogRepo: Repository<ZoneCatalog>,
    @InjectRepository(MunicipalityZone)
    private readonly muniZoneRepo: Repository<MunicipalityZone>,
    private readonly auditService: AuditService,
    private readonly centralConfigService: CentralConfigService,
  ) {}

  async findAllCatalog(
    query: ZoneQueryDto,
  ): Promise<PaginatedResponseDto<ZoneCatalog>> {
    const page = query.page || 1;
    const limit = query.limit || 50;

    const qb = this.zoneCatalogRepo.createQueryBuilder('zone');

    if (query.search) {
      qb.andWhere(
        '(zone.codigoZona ILIKE :search OR zone.nombreZona ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.andWhere('zone.activo = true');
    qb.orderBy('zone.codigoZona', 'ASC');
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async createZone(
    dto: CreateZoneDto,
    currentUser: RequestUser,
    sourceIp?: string,
  ): Promise<ZoneCatalog> {
    const zone = this.zoneCatalogRepo.create(dto);
    const saved = await this.zoneCatalogRepo.save(zone);

    await this.auditService.log({
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      userRole: currentUser.role,
      sourceIp,
      action: 'zone.create',
      module: 'zones',
      entityType: 'zone_catalog',
      entityId: saved.id,
      dataAfter: dto,
    });

    return saved;
  }

  async findMunicipalityZones(
    currentUser: RequestUser,
    query: ZoneQueryDto,
  ): Promise<PaginatedResponseDto<MunicipalityZone>> {
    const municipalityId = currentUser.municipalityId;
    const page = query.page || 1;
    const limit = query.limit || 50;

    const qb = this.muniZoneRepo
      .createQueryBuilder('mz')
      .leftJoinAndSelect('mz.zone', 'zone')
      .where('mz.municipalityId = :municipalityId', { municipalityId })
      .andWhere('mz.vigenciaHasta IS NULL');

    if (query.search) {
      qb.andWhere(
        '(zone.codigoZona ILIKE :search OR zone.nombreZona ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('zone.codigoZona', 'ASC');
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findMunicipalityZoneByZoneId(
    municipalityId: string,
    zoneId: string,
  ): Promise<MunicipalityZone | null> {
    return this.muniZoneRepo.findOne({
      where: {
        municipalityId,
        zoneId,
        vigenciaHasta: undefined, // active config (no end date)
      },
      relations: ['zone'],
    });
  }

  async configureMunicipalityZone(
    dto: ConfigureMunicipalityZoneDto,
    currentUser: RequestUser,
    sourceIp?: string,
  ): Promise<MunicipalityZone> {
    const municipalityId = currentUser.municipalityId;
    if (!municipalityId) {
      throw new ForbiddenException('User must belong to a municipality');
    }

    // Verify zone exists
    const zone = await this.zoneCatalogRepo.findOne({
      where: { id: dto.zoneId },
    });
    if (!zone) {
      throw new NotFoundException('Zone not found in catalog');
    }

    // Validate multiplicador against central config ranges
    await this.validateMultiplicadorRange(dto.multiplicador, currentUser, municipalityId, sourceIp);

    const muniZone = this.muniZoneRepo.create({
      municipalityId,
      zoneId: dto.zoneId,
      nivelDemanda: dto.nivelDemanda,
      multiplicador: dto.multiplicador,
      vigenciaDesde: new Date(dto.vigenciaDesde),
      justificacion: dto.justificacion || null,
    });

    const saved = await this.muniZoneRepo.save(muniZone);

    await this.auditService.log({
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      userRole: currentUser.role,
      municipalityId,
      sourceIp,
      action: 'zone.configure_municipality',
      module: 'zones',
      entityType: 'municipality_zones',
      entityId: saved.id,
      dataAfter: {
        zoneId: dto.zoneId,
        nivelDemanda: dto.nivelDemanda,
        multiplicador: dto.multiplicador,
      },
    });

    return saved;
  }

  async updateMunicipalityZone(
    id: string,
    dto: UpdateMunicipalityZoneDto,
    currentUser: RequestUser,
    sourceIp?: string,
  ): Promise<MunicipalityZone> {
    const municipalityId = currentUser.municipalityId!;
    const muniZone = await this.muniZoneRepo.findOne({
      where: { id, municipalityId },
    });

    if (!muniZone) {
      throw new NotFoundException('Municipality zone config not found');
    }

    const before = {
      nivelDemanda: muniZone.nivelDemanda,
      multiplicador: muniZone.multiplicador,
    };

    // Validate multiplicador against central config ranges
    if (dto.multiplicador !== undefined) {
      await this.validateMultiplicadorRange(dto.multiplicador, currentUser, municipalityId, sourceIp);
    }

    if (dto.nivelDemanda !== undefined) muniZone.nivelDemanda = dto.nivelDemanda;
    if (dto.multiplicador !== undefined) muniZone.multiplicador = dto.multiplicador;
    if (dto.justificacion !== undefined) muniZone.justificacion = dto.justificacion;

    const saved = await this.muniZoneRepo.save(muniZone);

    await this.auditService.log({
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      userRole: currentUser.role,
      municipalityId,
      sourceIp,
      action: 'zone.update_municipality',
      module: 'zones',
      entityType: 'municipality_zones',
      entityId: id,
      dataBefore: before,
      dataAfter: dto,
    });

    return saved;
  }

  private async validateMultiplicadorRange(
    multiplicador: number,
    currentUser: RequestUser,
    municipalityId: string,
    sourceIp?: string,
  ): Promise<void> {
    const centralConfig = await this.centralConfigService.getActive();
    if (!centralConfig) return;

    const min = Number(centralConfig.zonaMultMin);
    const max = Number(centralConfig.zonaMultMax);
    if (multiplicador < min || multiplicador > max) {
      await this.auditService.log({
        userId: currentUser.id,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
        userRole: currentUser.role,
        municipalityId,
        sourceIp,
        action: 'zone.out_of_range_attempt',
        module: 'zones',
        entityType: 'municipality_zones',
        entityId: null,
        dataAfter: { multiplicador, allowedMin: min, allowedMax: max },
      });
      throw new BadRequestException(
        `Zone multiplier (${multiplicador}) must be between ${min} and ${max} as defined by central configuration`,
      );
    }
  }
}
