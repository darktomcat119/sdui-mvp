import {
  IsNumber,
  Min,
  Max,
  IsInt,
  IsDateString,
  IsOptional,
  IsString,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'weightSum', async: false })
export class WeightSumConstraint implements ValidatorConstraintInterface {
  validate(_value: any, args: ValidationArguments) {
    const obj = args.object as CreateWeightConfigDto;
    const sum =
      Number(obj.pSuperficie) +
      Number(obj.pZona) +
      Number(obj.pGiro) +
      Number(obj.pTipo);
    return Math.abs(sum - 1.0) < 0.0001;
  }

  defaultMessage() {
    return 'The sum of pSuperficie, pZona, pGiro, and pTipo must equal 1.0';
  }
}

export class CreateWeightConfigDto {
  @IsNumber()
  @Min(0.25)
  @Max(0.4)
  pSuperficie: number;

  @IsNumber()
  @Min(0.2)
  @Max(0.3)
  pZona: number;

  @IsNumber()
  @Min(0.15)
  @Max(0.25)
  pGiro: number;

  @IsNumber()
  @Min(0.1)
  @Max(0.2)
  @Validate(WeightSumConstraint)
  pTipo: number;

  @IsNumber()
  @Min(0.01)
  @Max(0.25)
  limiteVariacionPct: number;

  @IsInt()
  @Min(2024)
  @Max(2100)
  ejercicioFiscal: number;

  @IsDateString()
  vigenciaDesde: string;

  @IsOptional()
  @IsString()
  justificacion?: string;

  @IsOptional()
  @IsString()
  folioActa?: string;
}
