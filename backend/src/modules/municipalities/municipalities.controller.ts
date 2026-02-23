import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  NotFoundException,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { MunicipalitiesService } from './municipalities.service';
import {
  CreateMunicipalityDto,
  UpdateMunicipalityDto,
} from './dto/create-municipality.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/constants/roles.constant';
import { RequestUser } from '../../common/interfaces/jwt-payload.interface';

@Controller('municipalities')
@UseGuards(RolesGuard)
export class MunicipalitiesController {
  constructor(
    private readonly municipalitiesService: MunicipalitiesService,
  ) {}

  @Get()
  @Roles(UserRole.SYSTEM_ADMIN)
  async findAll(@Query() pagination: PaginationDto) {
    return this.municipalitiesService.findAll(pagination);
  }

  @Get(':id')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.MUNICIPAL_ADMIN)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ) {
    const municipality = await this.municipalitiesService.findOneById(id);
    if (!municipality) {
      throw new NotFoundException('Municipality not found');
    }
    // Municipal admins can only see their own municipality
    if (
      user.role === UserRole.MUNICIPAL_ADMIN &&
      municipality.id !== user.municipalityId
    ) {
      throw new NotFoundException('Municipality not found');
    }
    return { data: municipality };
  }

  @Post()
  @Roles(UserRole.SYSTEM_ADMIN)
  async create(
    @Body() dto: CreateMunicipalityDto,
    @CurrentUser() currentUser: RequestUser,
    @Req() req: Request,
  ) {
    const result = await this.municipalitiesService.create(
      dto,
      currentUser,
      req.ip,
    );
    return { data: result, message: 'Municipality created successfully' };
  }

  @Patch(':id')
  @Roles(UserRole.SYSTEM_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMunicipalityDto,
    @CurrentUser() currentUser: RequestUser,
    @Req() req: Request,
  ) {
    const result = await this.municipalitiesService.update(
      id,
      dto,
      currentUser,
      req.ip,
    );
    return { data: result, message: 'Municipality updated successfully' };
  }
}
