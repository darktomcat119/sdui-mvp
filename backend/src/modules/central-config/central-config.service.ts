import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CentralConfigVersion } from './entities/central-config-version.entity';
import { CreateCentralConfigDto } from './dto/central-config.dto';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class CentralConfigService {
  constructor(
    @InjectRepository(CentralConfigVersion)
    private readonly configRepo: Repository<CentralConfigVersion>,
    private readonly auditService: AuditService,
  ) {}

  async getActive(): Promise<CentralConfigVersion | null> {
    return this.configRepo.findOne({
      where: { active: true },
      order: { version: 'DESC' },
    });
  }

  async getHistory(): Promise<CentralConfigVersion[]> {
    return this.configRepo.find({
      order: { version: 'DESC' },
    });
  }

  async create(
    dto: CreateCentralConfigDto,
    currentUser: RequestUser,
    sourceIp?: string,
  ): Promise<CentralConfigVersion> {
    // Get next version number
    const latest = await this.configRepo.findOne({
      order: { version: 'DESC' },
    });
    const nextVersion = latest ? latest.version + 1 : 1;

    const config = this.configRepo.create({
      version: nextVersion,
      pSuperficieMin: dto.pSuperficieMin,
      pSuperficieMax: dto.pSuperficieMax,
      pZonaMin: dto.pZonaMin,
      pZonaMax: dto.pZonaMax,
      pGiroMin: dto.pGiroMin,
      pGiroMax: dto.pGiroMax,
      pTipoMin: dto.pTipoMin,
      pTipoMax: dto.pTipoMax,
      zonaMultMin: dto.zonaMultMin,
      zonaMultMax: dto.zonaMultMax,
      variacionLimitMin: dto.variacionLimitMin,
      variacionLimitMax: dto.variacionLimitMax,
      itdThresholdProtegido: dto.itdThresholdProtegido,
      itdThresholdProporcional: dto.itdThresholdProporcional,
      justification: dto.justification || null,
      createdBy: currentUser.id,
      active: false,
    });

    const saved = await this.configRepo.save(config);

    await this.auditService.log({
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      userRole: currentUser.role,
      municipalityId: null,
      sourceIp,
      action: 'central_config.create',
      module: 'central-config',
      entityType: 'central_config_versions',
      entityId: saved.id,
      dataAfter: { version: saved.version },
    });

    return saved;
  }

  async activate(
    id: string,
    currentUser: RequestUser,
    sourceIp?: string,
  ): Promise<CentralConfigVersion> {
    const config = await this.configRepo.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException('Configuration version not found');
    }
    if (config.active) {
      throw new BadRequestException('This version is already active');
    }

    // Deactivate all
    await this.configRepo.update({}, { active: false });

    // Activate this one
    config.active = true;
    const saved = await this.configRepo.save(config);

    await this.auditService.log({
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      userRole: currentUser.role,
      municipalityId: null,
      sourceIp,
      action: 'central_config.activate',
      module: 'central-config',
      entityType: 'central_config_versions',
      entityId: id,
      dataAfter: { version: saved.version, active: true },
    });

    return saved;
  }
}
