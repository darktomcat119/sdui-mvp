import {
  Controller,
  Get,
  UseGuards,
  Res,
  Req,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ReportsService } from './reports.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/constants/roles.constant';
import { RequestUser } from '../../common/interfaces/jwt-payload.interface';
import { AuditService } from '../audit/audit.service';

@Controller('reports')
@UseGuards(RolesGuard)
@Roles(UserRole.MUNICIPAL_ADMIN, UserRole.TREASURY_OPERATOR, UserRole.COMPTROLLER_AUDITOR, UserRole.LEGAL_ANALYST)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly auditService: AuditService,
  ) {}

  @Get('executive-summary')
  async getExecutiveSummary(@CurrentUser() user: RequestUser) {
    const data = await this.reportsService.getExecutiveSummary(user);
    return { data };
  }

  @Get('determinations/csv')
  @Roles(UserRole.MUNICIPAL_ADMIN, UserRole.COMPTROLLER_AUDITOR)
  async exportCsv(
    @CurrentUser() user: RequestUser,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const csv = await this.reportsService.exportDeterminationsCsv(user);

    await this.auditService.log({
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userRole: user.role,
      municipalityId: user.municipalityId,
      sourceIp: req.ip,
      action: 'report.export_csv',
      module: 'reports',
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=determinaciones_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    res.send(csv);
  }
}
