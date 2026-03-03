import { IsUUID, IsOptional } from 'class-validator';

export class GenerateDictamenDto {
  @IsUUID()
  determinationId: string;
}

export class DocumentQueryDto {
  @IsOptional()
  @IsUUID()
  determinationId?: string;
}
