import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class QueryRapportDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateDebut?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFin?: string;

  @ApiPropertyOptional({ enum: ['jour', 'semaine', 'mois'] })
  @IsOptional()
  @IsEnum(['jour', 'semaine', 'mois'])
  groupBy: 'jour' | 'semaine' | 'mois' = 'jour';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  boutiqueId?: string;
}
