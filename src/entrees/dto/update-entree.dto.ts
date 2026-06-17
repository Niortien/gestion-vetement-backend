import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateEntreeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fournisseur?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
