import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateSortieDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
