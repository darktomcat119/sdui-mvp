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
import { DeterminationsService } from './determinations.service';
import {
  ExecuteDeterminationDto,
  DeterminationQueryDto,
  ResolveLimitExceptionDto,
} from './dto/determinations.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/constants/roles.constant';
import { RequestUser } from '../../common/interfaces/jwt-payload.interface';

@Controller('determinations')
@UseGuards(RolesGuard)
export class DeterminationsController {
  constructor(
    private readonly determinationsService: DeterminationsService,
  ) {}

  @Post('execute')
  @Roles(UserRole.MUNICIPAL_ADMIN)
  async execute(
    @Body() dto: ExecuteDeterminationDto,
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
  ) {
    const result = await this.determinationsService.execute(
      dto.taxpayerIds,
      user,
      req.ip,
    );
    return {
      data: result.summary,
      message: `Determination executed for ${result.determinations.length} taxpayers`,
    };
  }

  @Get()
  @Roles(UserRole.MUNICIPAL_ADMIN, UserRole.TREASURY_OPERATOR, UserRole.VALIDADOR_TECNICO)
  async findAll(
    @Query() query: DeterminationQueryDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.determinationsService.findAll(query, user);
  }

  @Get('summary')
  @Roles(UserRole.MUNICIPAL_ADMIN, UserRole.TREASURY_OPERATOR, UserRole.VALIDADOR_TECNICO)
  async getSummary(@CurrentUser() user: RequestUser) {
    const data = await this.determinationsService.getSummary(user);
    return { data };
  }

  @Get('exceptions')
  @Roles(UserRole.MUNICIPAL_ADMIN, UserRole.VALIDADOR_TECNICO)
  async findExceptions(
    @CurrentUser() user: RequestUser,
    @Query() pagination: PaginationDto,
  ) {
    return this.determinationsService.findExceptions(user, pagination);
  }

  @Get(':id')
  @Roles(UserRole.MUNICIPAL_ADMIN, UserRole.TREASURY_OPERATOR, UserRole.VALIDADOR_TECNICO)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ) {
    const data = await this.determinationsService.findOne(id, user);
    return { data };
  }

  @Patch(':id/approve')
  @Roles(UserRole.MUNICIPAL_ADMIN)
  async approve(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
  ) {
    const data = await this.determinationsService.approve(id, user, req.ip);
    return { data, message: 'Determination approved successfully' };
  }

  @Patch('exceptions/:id')
  @Roles(UserRole.MUNICIPAL_ADMIN, UserRole.VALIDADOR_TECNICO)
  async resolveException(
    @Param('id') id: string,
    @Body() dto: ResolveLimitExceptionDto,
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
  ) {
    const data = await this.determinationsService.resolveException(
      id,
      dto,
      user,
      req.ip,
    );
    return { data, message: 'Exception resolved successfully' };
  }
}
