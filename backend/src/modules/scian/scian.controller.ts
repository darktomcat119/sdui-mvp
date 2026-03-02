import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ScianService } from './scian.service';
import { UpdateScianImpactDto, ScianQueryDto, ToggleMunicipalityScianDto } from './dto/scian.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/constants/roles.constant';
import { RequestUser } from '../../common/interfaces/jwt-payload.interface';

@Controller('scian')
@UseGuards(RolesGuard)
export class ScianController {
  constructor(private readonly scianService: ScianService) {}

  @Get()
  async findAll(@Query() query: ScianQueryDto) {
    return this.scianService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.scianService.findOne(id);
    return { data };
  }

  @Patch(':id/impact')
  @Roles(UserRole.SYSTEM_ADMIN)
  async updateImpact(
    @Param('id') id: string,
    @Body() dto: UpdateScianImpactDto,
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
  ) {
    const data = await this.scianService.updateImpact(
      id,
      dto.impactoSdui,
      user,
      req.ip,
    );
    return { data, message: 'SCIAN impact updated successfully' };
  }

  @Get('municipality/:municipalityId')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.MUNICIPAL_ADMIN)
  async findByMunicipality(
    @Param('municipalityId') municipalityId: string,
    @Query() query: ScianQueryDto,
  ) {
    return this.scianService.findByMunicipality(municipalityId, query);
  }

  @Patch('municipality/:municipalityId/:scianId')
  @Roles(UserRole.MUNICIPAL_ADMIN)
  async toggleMunicipalityScian(
    @Param('municipalityId') municipalityId: string,
    @Param('scianId') scianId: string,
    @Body() dto: ToggleMunicipalityScianDto,
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
  ) {
    const data = await this.scianService.toggleMunicipalityScian(
      municipalityId,
      scianId,
      dto.activo,
      user,
      req.ip,
    );
    return { data, message: 'Municipality SCIAN updated successfully' };
  }
}
