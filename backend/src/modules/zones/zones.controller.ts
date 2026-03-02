import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ZonesService } from './zones.service';
import {
  CreateZoneDto,
  ConfigureMunicipalityZoneDto,
  UpdateMunicipalityZoneDto,
  ZoneQueryDto,
} from './dto/zones.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/constants/roles.constant';
import { RequestUser } from '../../common/interfaces/jwt-payload.interface';

@Controller('zones')
@UseGuards(RolesGuard)
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @Get('catalog')
  async findAllCatalog(@Query() query: ZoneQueryDto) {
    return this.zonesService.findAllCatalog(query);
  }

  @Post('catalog')
  @Roles(UserRole.SYSTEM_ADMIN)
  async createZone(
    @Body() dto: CreateZoneDto,
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
  ) {
    const data = await this.zonesService.createZone(dto, user, req.ip);
    return { data, message: 'Zone created successfully' };
  }

  @Get('municipality')
  @Roles(UserRole.MUNICIPAL_ADMIN, UserRole.TREASURY_OPERATOR)
  async findMunicipalityZones(
    @CurrentUser() user: RequestUser,
    @Query() query: ZoneQueryDto,
  ) {
    return this.zonesService.findMunicipalityZones(user, query);
  }

  @Post('municipality')
  @Roles(UserRole.MUNICIPAL_ADMIN)
  async configureMunicipalityZone(
    @Body() dto: ConfigureMunicipalityZoneDto,
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
  ) {
    const data = await this.zonesService.configureMunicipalityZone(
      dto,
      user,
      req.ip,
    );
    return { data, message: 'Municipality zone configured successfully' };
  }

  @Patch('municipality/:id')
  @Roles(UserRole.MUNICIPAL_ADMIN)
  async updateMunicipalityZone(
    @Param('id') id: string,
    @Body() dto: UpdateMunicipalityZoneDto,
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
  ) {
    const data = await this.zonesService.updateMunicipalityZone(
      id,
      dto,
      user,
      req.ip,
    );
    return { data, message: 'Municipality zone updated successfully' };
  }
}
