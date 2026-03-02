import { IsString, IsIn, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class UpdateScianImpactDto {
  @IsString()
  @IsIn(['bajo', 'medio', 'alto'])
  impactoSdui: string;
}

export class ScianQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  @IsIn(['bajo', 'medio', 'alto'])
  impacto?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  activo?: boolean;
}

export class ToggleMunicipalityScianDto {
  @IsBoolean()
  activo: boolean;
}
