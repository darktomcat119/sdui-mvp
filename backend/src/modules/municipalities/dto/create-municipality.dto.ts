import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateMunicipalityDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsOptional()
  @IsString()
  officialName?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

export class UpdateMunicipalityDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  officialName?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  status?: 'active' | 'inactive' | 'suspended';
}
