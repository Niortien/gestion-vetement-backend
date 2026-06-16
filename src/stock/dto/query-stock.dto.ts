import { ApiPropertyOptional } from '@nestjs/swagger';
import { TailleVariante, TypeMouvementStock } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryStockDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  alerte?: boolean;

  @ApiPropertyOptional({ enum: TailleVariante })
  @IsOptional()
  @IsEnum(TailleVariante)
  taille?: TailleVariante;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  couleur?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categorieId?: string;
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
}

export class UpdateVarianteDto {
  @ApiPropertyOptional({ enum: TailleVariante })
  @IsOptional()
  @IsEnum(TailleVariante)
  taille?: TailleVariante;

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
  @IsString()
  variation!: number;
}
