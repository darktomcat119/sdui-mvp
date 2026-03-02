import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { TaxpayersService } from './taxpayers.service';
import {
  CreateTaxpayerDto,
  UpdateTaxpayerDto,
  TaxpayerQueryDto,
} from './dto/taxpayers.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/constants/roles.constant';
import { RequestUser } from '../../common/interfaces/jwt-payload.interface';

@Controller('taxpayers')
@UseGuards(RolesGuard)
@Roles(UserRole.MUNICIPAL_ADMIN, UserRole.TREASURY_OPERATOR)
export class TaxpayersController {
  constructor(private readonly taxpayersService: TaxpayersService) {}

  @Get()
  async findAll(
    @Query() query: TaxpayerQueryDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.taxpayersService.findAll(query, user);
  }

  @Get('stats')
  async getStats(@CurrentUser() user: RequestUser) {
    const data = await this.taxpayersService.getStats(user);
    return { data };
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ) {
    const data = await this.taxpayersService.findOne(id, user);
    return { data };
  }

  @Post()
  async create(
    @Body() dto: CreateTaxpayerDto,
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
  ) {
    const data = await this.taxpayersService.create(dto, user, req.ip);
    return { data, message: 'Taxpayer created successfully' };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTaxpayerDto,
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
  ) {
    const data = await this.taxpayersService.update(id, dto, user, req.ip);
    return { data, message: 'Taxpayer updated successfully' };
  }

  @Post('bulk-upload')
  @Roles(UserRole.MUNICIPAL_ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (_req, file, cb) => {
        if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
          cb(new BadRequestException('Only CSV files are allowed'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async bulkUpload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
  ) {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }
    const csvContent = file.buffer.toString('utf-8');
    const result = await this.taxpayersService.bulkUpload(
      csvContent,
      user,
      req.ip,
    );
    return { data: result, message: 'Bulk upload completed' };
  }
}
