import { ApiPropertyOptional } from '@nestjs/swagger';
import { TypeMouvementStock } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryStockDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  alerte?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  taille?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  couleur?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categorieId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  boutiqueId?: string;
}

export class QueryMouvementDto extends PaginationDto {
  @ApiPropertyOptional({ enum: TypeMouvementStock })
  @IsOptional()
  @IsEnum(TypeMouvementStock)
  type?: TypeMouvementStock;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateDebut?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  produitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  boutiqueId?: string;
}

export class UpdateVarianteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  taille?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  couleur?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seuilAlerte?: number;
}

export class AdjustVarianteStockDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  motif?: string;

  @ApiPropertyOptional()
  @IsNotEmpty()
  @IsInt()
  variation!: number;
}
