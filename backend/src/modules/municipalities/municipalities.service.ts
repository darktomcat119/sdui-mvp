import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Municipality } from './entities/municipality.entity';
import {
  CreateMunicipalityDto,
  UpdateMunicipalityDto,
} from './dto/create-municipality.dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class MunicipalitiesService {
  constructor(
    @InjectRepository(Municipality)
    private readonly municipalityRepo: Repository<Municipality>,
    private readonly auditService: AuditService,
  ) {}

  async findAll(
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<Municipality>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;

    const [data, total] = await this.municipalityRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOneById(id: string): Promise<Municipality | null> {
    return this.municipalityRepo.findOne({ where: { id } });
  }

  async create(
    dto: CreateMunicipalityDto,
    currentUser: RequestUser,
    sourceIp?: string,
  ): Promise<Municipality> {
    const existing = await this.municipalityRepo.findOne({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException('A municipality with this slug already exists');
    }

    const municipality = this.municipalityRepo.create({
      name: dto.name,
      slug: dto.slug,
      state: dto.state,
      officialName: dto.officialName || null,
      timezone: dto.timezone || 'America/Mexico_City',
    });

    const saved = await this.municipalityRepo.save(municipality);

    await this.auditService.log({
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      userRole: currentUser.role,
      municipalityId: null,
      sourceIp,
      action: 'municipality.create',
      module: 'municipalities',
      entityType: 'municipality',
      entityId: saved.id,
      dataAfter: { name: saved.name, slug: saved.slug, state: saved.state },
    });

    return saved;
  }

  async update(
    id: string,
    dto: UpdateMunicipalityDto,
    currentUser: RequestUser,
    sourceIp?: string,
  ): Promise<Municipality> {
    const municipality = await this.findOneById(id);
    if (!municipality) {
      throw new NotFoundException('Municipality not found');
    }

    const dataBefore = {
      name: municipality.name,
      state: municipality.state,
      status: municipality.status,
    };

    if (dto.name) municipality.name = dto.name;
    if (dto.state) municipality.state = dto.state;
    if (dto.officialName !== undefined)
      municipality.officialName = dto.officialName;
    if (dto.timezone) municipality.timezone = dto.timezone;
    if (dto.status) municipality.status = dto.status;
    if (dto.cuotaBaseLegal !== undefined)
      municipality.cuotaBaseLegal = dto.cuotaBaseLegal;

    const saved = await this.municipalityRepo.save(municipality);

    await this.auditService.log({
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      userRole: currentUser.role,
      municipalityId: null,
      sourceIp,
      action: 'municipality.update',
      module: 'municipalities',
      entityType: 'municipality',
      entityId: saved.id,
      dataBefore,
      dataAfter: {
        name: saved.name,
        state: saved.state,
        status: saved.status,
      },
    });

    return saved;
  }
}
