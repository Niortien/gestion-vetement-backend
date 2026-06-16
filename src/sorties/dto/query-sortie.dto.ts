import { ApiPropertyOptional } from '@nestjs/swagger';
import { TypeSortie } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QuerySortieDto extends PaginationDto {
  @ApiPropertyOptional({ enum: TypeSortie })
  @IsOptional()
  @IsEnum(TypeSortie)
  type?: TypeSortie;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateDebut?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFin?: string;
}
