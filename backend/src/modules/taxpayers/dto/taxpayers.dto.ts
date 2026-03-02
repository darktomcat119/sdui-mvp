import {
  IsString,
  IsIn,
  IsOptional,
  IsNumber,
  IsUUID,
  Min,
  MaxLength,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateTaxpayerDto {
  @IsString()
  @MaxLength(300)
  razonSocial: string;

  @IsString()
  @IsIn(['fisica', 'moral'])
  tipoPersonalidad: string;

  @IsOptional()
  @IsString()
  @MaxLength(13)
  rfc?: string;

  @IsOptional()
  @IsString()
  @MaxLength(18)
  curp?: string;

  @IsString()
  @IsIn(['apertura', 'renovacion'])
  tipoTramite: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  numeroLicencia?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  claveCatastral?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  usoSuelo?: string;

  @IsOptional()
  @IsString()
  actividadRegulada?: string;

  @IsUUID()
  scianId: string;

  @IsUUID()
  zoneId: string;

  @IsString()
  @IsIn(['independiente', 'franquicia', 'cadena'])
  tipoContribuyente: string;

  @IsNumber()
  @Min(0.01)
  superficieM2: number;

  @IsNumber()
  @Min(0)
  cuotaVigente: number;
}

export class UpdateTaxpayerDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  razonSocial?: string;

  @IsOptional()
  @IsString()
  @IsIn(['fisica', 'moral'])
  tipoPersonalidad?: string;

  @IsOptional()
  @IsString()
  @MaxLength(13)
  rfc?: string;

  @IsOptional()
  @IsString()
  @MaxLength(18)
  curp?: string;

  @IsOptional()
  @IsString()
  @IsIn(['apertura', 'renovacion'])
  tipoTramite?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  numeroLicencia?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  claveCatastral?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  usoSuelo?: string;

  @IsOptional()
  @IsString()
  actividadRegulada?: string;

  @IsOptional()
  @IsUUID()
  scianId?: string;

  @IsOptional()
  @IsUUID()
  zoneId?: string;

  @IsOptional()
  @IsString()
  @IsIn(['independiente', 'franquicia', 'cadena'])
  tipoContribuyente?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  superficieM2?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cuotaVigente?: number;

  @IsOptional()
  @IsString()
  @IsIn(['activo', 'inactivo', 'suspendido'])
  estatus?: string;
}

export class TaxpayerQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  scianId?: string;

  @IsOptional()
  @IsUUID()
  zoneId?: string;

  @IsOptional()
  @IsString()
  @IsIn(['independiente', 'franquicia', 'cadena'])
  tipoContribuyente?: string;

  @IsOptional()
  @IsString()
  @IsIn(['activo', 'inactivo', 'suspendido'])
  estatus?: string;
}
