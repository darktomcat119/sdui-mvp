import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { AuditService, AuditQueryDto } from './audit.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/constants/roles.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/jwt-payload.interface';

@Controller('audit-logs')
@UseGuards(RolesGuard)
@Roles(
  UserRole.SYSTEM_ADMIN,
  UserRole.MUNICIPAL_ADMIN,
  UserRole.COMPTROLLER_AUDITOR,
)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async findAll(
    @Query() query: AuditQueryDto,
    @CurrentUser() user: RequestUser,
  ) {
    const municipalityId =
      user.role === UserRole.SYSTEM_ADMIN ? null : user.municipalityId;
    return this.auditService.findAll(query, municipalityId);
  }

  @Get(':id')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.COMPTROLLER_AUDITOR)
  async findOne(@Param('id') id: string) {
    const log = await this.auditService.findOne(id);
    if (!log) {
      throw new NotFoundException('Audit log entry not found');
    }
    return { data: log };
  }
}
