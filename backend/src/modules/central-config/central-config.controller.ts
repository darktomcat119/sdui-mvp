import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { CentralConfigService } from './central-config.service';
import { CreateCentralConfigDto } from './dto/central-config.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/constants/roles.constant';
import { RequestUser } from '../../common/interfaces/jwt-payload.interface';

@Controller('central-config')
@UseGuards(RolesGuard)
export class CentralConfigController {
  constructor(
    private readonly centralConfigService: CentralConfigService,
  ) {}

  @Get()
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.MUNICIPAL_ADMIN)
  async getActive() {
    const data = await this.centralConfigService.getActive();
    return { data };
  }

  @Get('history')
  @Roles(UserRole.SYSTEM_ADMIN)
  async getHistory() {
    const data = await this.centralConfigService.getHistory();
    return { data };
  }

  @Post()
  @Roles(UserRole.SYSTEM_ADMIN)
  async create(
    @Body() dto: CreateCentralConfigDto,
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
  ) {
    const data = await this.centralConfigService.create(dto, user, req.ip);
    return { data, message: 'Central configuration version created' };
  }

  @Patch(':id/activate')
  @Roles(UserRole.SYSTEM_ADMIN)
  async activate(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
  ) {
    const data = await this.centralConfigService.activate(id, user, req.ip);
    return { data, message: 'Configuration version activated' };
  }
}
