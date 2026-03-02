import {
  IsOptional,
  IsArray,
  IsUUID,
  IsString,
  IsIn,
  MinLength,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ExecuteDeterminationDto {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  taxpayerIds?: string[];
}

export class DeterminationQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @IsIn(['protegido', 'moderado', 'proporcional'])
  clasificacion?: string;

  @IsOptional()
  @IsString()
  @IsIn(['calculada', 'aprobada', 'bloqueada', 'excepcion_pendiente'])
  estatus?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class ResolveLimitExceptionDto {
  @IsString()
  @IsIn(['APROBAR', 'RECHAZAR', 'ESCALAR'])
  resolutionOption: string;

  @IsString()
  @MinLength(500)
  justificacion: string;

  @IsOptional()
  @IsUUID()
  escalatedTo?: string;
}
