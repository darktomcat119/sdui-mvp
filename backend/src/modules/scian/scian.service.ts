import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScianCatalog } from './entities/scian-catalog.entity';
import { MunicipalityScian } from './entities/municipality-scian.entity';
import { ScianQueryDto } from './dto/scian.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class ScianService {
  constructor(
    @InjectRepository(ScianCatalog)
    private readonly scianRepo: Repository<ScianCatalog>,
    @InjectRepository(MunicipalityScian)
    private readonly muniScianRepo: Repository<MunicipalityScian>,
    private readonly auditService: AuditService,
  ) {}

  async findAll(
    query: ScianQueryDto,
  ): Promise<PaginatedResponseDto<ScianCatalog>> {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const qb = this.scianRepo.createQueryBuilder('scian');

    if (query.search) {
      qb.andWhere(
        '(scian.codigoScian ILIKE :search OR scian.descripcionScian ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }
    if (query.impacto) {
      qb.andWhere('scian.impactoSdui = :impacto', { impacto: query.impacto });
    }
    if (query.activo !== undefined) {
      qb.andWhere('scian.activo = :activo', { activo: query.activo });
    }

    qb.orderBy('scian.codigoScian', 'ASC');
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOne(id: string): Promise<ScianCatalog> {
    const scian = await this.scianRepo.findOne({ where: { id } });
    if (!scian) {
      throw new NotFoundException('SCIAN code not found');
    }
    return scian;
  }

  async findByCode(codigoScian: string): Promise<ScianCatalog | null> {
    return this.scianRepo.findOne({ where: { codigoScian } });
  }

  async updateImpact(
    id: string,
    impactoSdui: string,
    currentUser: RequestUser,
    sourceIp?: string,
  ): Promise<ScianCatalog> {
    const scian = await this.findOne(id);
    const before = { impactoSdui: scian.impactoSdui };
    scian.impactoSdui = impactoSdui;
    const saved = await this.scianRepo.save(scian);

    await this.auditService.log({
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      userRole: currentUser.role,
      municipalityId: currentUser.municipalityId,
      sourceIp,
      action: 'scian.update_impact',
      module: 'scian',
      entityType: 'scian_catalog',
      entityId: id,
      dataBefore: before,
      dataAfter: { impactoSdui },
    });

    return saved;
  }

  async findByMunicipality(
    municipalityId: string,
    query: ScianQueryDto,
  ): Promise<PaginatedResponseDto<any>> {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const qb = this.muniScianRepo
      .createQueryBuilder('ms')
      .leftJoinAndSelect('ms.scian', 'scian')
      .where('ms.municipalityId = :municipalityId', { municipalityId });

    if (query.search) {
      qb.andWhere(
        '(scian.codigoScian ILIKE :search OR scian.descripcionScian ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }
    if (query.activo !== undefined) {
      qb.andWhere('ms.activo = :activo', { activo: query.activo });
    }

    qb.orderBy('scian.codigoScian', 'ASC');
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async toggleMunicipalityScian(
    municipalityId: string,
    scianId: string,
    activo: boolean,
    currentUser: RequestUser,
    sourceIp?: string,
  ): Promise<MunicipalityScian> {
    let muniScian = await this.muniScianRepo.findOne({
      where: { municipalityId, scianId },
    });

    if (muniScian) {
      const before = { activo: muniScian.activo };
      muniScian.activo = activo;
      const saved = await this.muniScianRepo.save(muniScian);
      await this.auditService.log({
        userId: currentUser.id,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
        userRole: currentUser.role,
        municipalityId,
        sourceIp,
        action: 'scian.toggle_municipality',
        module: 'scian',
        entityType: 'municipality_scian',
        entityId: saved.id,
        dataBefore: before,
        dataAfter: { activo },
      });
      return saved;
    }

    muniScian = this.muniScianRepo.create({
      municipalityId,
      scianId,
      activo,
    });
    const saved = await this.muniScianRepo.save(muniScian);
    await this.auditService.log({
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      userRole: currentUser.role,
      municipalityId,
      sourceIp,
      action: 'scian.activate_municipality',
      module: 'scian',
      entityType: 'municipality_scian',
      entityId: saved.id,
      dataAfter: { municipalityId, scianId, activo },
    });
    return saved;
  }
}
