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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, UpdateUserStatusDto } from './dto/update-user.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/constants/roles.constant';
import { RequestUser } from '../../common/interfaces/jwt-payload.interface';

@Controller('users')
@UseGuards(RolesGuard)
@Roles(UserRole.SYSTEM_ADMIN, UserRole.MUNICIPAL_ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(
    @Query() pagination: PaginationDto,
    @CurrentUser() user: RequestUser,
  ) {
    const municipalityId =
      user.role === UserRole.SYSTEM_ADMIN ? null : user.municipalityId;
    return this.usersService.findAll(pagination, municipalityId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: RequestUser,
  ) {
    const user = await this.usersService.findOneById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // Municipal admins can only view users in their own municipality
    if (
      currentUser.role !== UserRole.SYSTEM_ADMIN &&
      user.municipalityId !== currentUser.municipalityId
    ) {
      throw new NotFoundException('User not found');
    }
    const { passwordHash, ...result } = user as any;
    return { data: result };
  }

  @Post()
  async create(
    @Body() dto: CreateUserDto,
    @CurrentUser() currentUser: RequestUser,
    @Req() req: Request,
  ) {
    const result = await this.usersService.create(
      dto,
      currentUser,
      req.ip,
    );
    return { data: result, message: 'User created successfully' };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: RequestUser,
    @Req() req: Request,
  ) {
    const result = await this.usersService.update(
      id,
      dto,
      currentUser,
      req.ip,
    );
    return { data: result, message: 'User updated successfully' };
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() currentUser: RequestUser,
    @Req() req: Request,
  ) {
    const result = await this.usersService.updateStatus(
      id,
      dto.status,
      currentUser,
      req.ip,
    );
    return { data: result, message: 'User status updated successfully' };
  }
}
