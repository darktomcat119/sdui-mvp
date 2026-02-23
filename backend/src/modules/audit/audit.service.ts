import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';

export interface AuditLogParams {
  userId: string;
  userName: string;
  userRole: string;
  municipalityId?: string | null;
  sourceIp?: string | null;
  action: string;
  module: string;
  entityType?: string | null;
  entityId?: string | null;
  dataBefore?: Record<string, any> | null;
  dataAfter?: Record<string, any> | null;
  metadata?: Record<string, any>;
}

export interface AuditQueryDto extends PaginationDto {
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  action?: string;
  module?: string;
  entityType?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async log(params: AuditLogParams): Promise<void> {
    try {
      const entry = this.auditRepo.create({
        userId: params.userId,
        userName: params.userName,
        userRole: params.userRole,
        municipalityId: params.municipalityId || null,
        sourceIp: params.sourceIp || null,
        action: params.action,
        module: params.module,
        entityType: params.entityType || null,
        entityId: params.entityId || null,
        dataBefore: params.dataBefore || null,
        dataAfter: params.dataAfter || null,
        metadata: params.metadata || {},
      });
      await this.auditRepo.save(entry);
    } catch (error) {
      this.logger.error('Failed to write audit log', error);
    }
  }

  async findAll(
    query: AuditQueryDto,
    municipalityId?: string | null,
  ): Promise<PaginatedResponseDto<AuditLog>> {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const qb = this.auditRepo.createQueryBuilder('audit');

    if (municipalityId) {
      qb.andWhere('audit.municipalityId = :municipalityId', { municipalityId });
    }
    if (query.dateFrom) {
      qb.andWhere('audit.timestamp >= :dateFrom', { dateFrom: query.dateFrom });
    }
    if (query.dateTo) {
      qb.andWhere('audit.timestamp <= :dateTo', { dateTo: query.dateTo });
    }
    if (query.userId) {
      qb.andWhere('audit.userId = :userId', { userId: query.userId });
    }
    if (query.action) {
      qb.andWhere('audit.action = :action', { action: query.action });
    }
    if (query.module) {
      qb.andWhere('audit.module = :module', { module: query.module });
    }
    if (query.entityType) {
      qb.andWhere('audit.entityType = :entityType', { entityType: query.entityType });
    }

    qb.orderBy('audit.timestamp', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOne(id: string): Promise<AuditLog | null> {
    return this.auditRepo.findOne({ where: { id } });
  }
}
