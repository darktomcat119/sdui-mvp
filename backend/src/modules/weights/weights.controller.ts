import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { WeightsService } from './weights.service';
import { CreateWeightConfigDto } from './dto/weights.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/constants/roles.constant';
import { RequestUser } from '../../common/interfaces/jwt-payload.interface';

@Controller('weights')
@UseGuards(RolesGuard)
@Roles(UserRole.MUNICIPAL_ADMIN, UserRole.TREASURY_OPERATOR)
export class WeightsController {
  constructor(private readonly weightsService: WeightsService) {}

  @Get()
  async findCurrent(@CurrentUser() user: RequestUser) {
    const data = await this.weightsService.findCurrent(user);
    return { data };
  }

  @Get('history')
  @Roles(UserRole.MUNICIPAL_ADMIN)
  async findHistory(
    @CurrentUser() user: RequestUser,
    @Query() pagination: PaginationDto,
  ) {
    return this.weightsService.findHistory(user, pagination);
  }

  @Post()
  @Roles(UserRole.MUNICIPAL_ADMIN)
  async create(
    @Body() dto: CreateWeightConfigDto,
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
  ) {
    const data = await this.weightsService.create(dto, user, req.ip);
    return { data, message: 'Weight configuration created successfully' };
  }
}
