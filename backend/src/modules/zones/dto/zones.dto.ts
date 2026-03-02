import {
  IsString,
  IsIn,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateZoneDto {
  @IsString()
  codigoZona: string;

  @IsString()
  nombreZona: string;
}

export class ConfigureMunicipalityZoneDto {
  @IsUUID()
  zoneId: string;

  @IsString()
  @IsIn(['baja', 'media', 'alta'])
  nivelDemanda: string;

  @IsNumber()
  @Min(0.6)
  @Max(1.5)
  multiplicador: number;

  @IsDateString()
  vigenciaDesde: string;

  @IsOptional()
  @IsString()
  justificacion?: string;
}

export class UpdateMunicipalityZoneDto {
  @IsOptional()
  @IsString()
  @IsIn(['baja', 'media', 'alta'])
  nivelDemanda?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.6)
  @Max(1.5)
  multiplicador?: number;

  @IsOptional()
  @IsString()
  justificacion?: string;
}

export class ZoneQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;
}
