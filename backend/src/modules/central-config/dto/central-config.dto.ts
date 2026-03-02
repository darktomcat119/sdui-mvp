import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class CreateCentralConfigDto {
  @IsNumber() @Min(0) @Max(1) pSuperficieMin: number;
  @IsNumber() @Min(0) @Max(1) pSuperficieMax: number;
  @IsNumber() @Min(0) @Max(1) pZonaMin: number;
  @IsNumber() @Min(0) @Max(1) pZonaMax: number;
  @IsNumber() @Min(0) @Max(1) pGiroMin: number;
  @IsNumber() @Min(0) @Max(1) pGiroMax: number;
  @IsNumber() @Min(0) @Max(1) pTipoMin: number;
  @IsNumber() @Min(0) @Max(1) pTipoMax: number;
  @IsNumber() @Min(0) zonaMultMin: number;
  @IsNumber() @Min(0) zonaMultMax: number;
  @IsNumber() @Min(0) @Max(1) variacionLimitMin: number;
  @IsNumber() @Min(0) @Max(1) variacionLimitMax: number;
  @IsNumber() @Min(0) @Max(1) itdThresholdProtegido: number;
  @IsNumber() @Min(0) @Max(1) itdThresholdProporcional: number;
  @IsOptional() @IsString() justification?: string;
}
