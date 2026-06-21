import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TypeSortie } from '@prisma/client';
import {
  IsArray,
  IsDateString,
  IsDecimal,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class CreateLigneSortieDto {
  @ApiProperty()
  @IsString()
  varianteId!: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  quantite!: number;

  @ApiProperty({ example: '12000.00' })
  @IsDecimal({ decimal_digits: '1,2' })
  prixUnitaire!: string;
}

export class CreateSortieDto {
  @ApiProperty({ enum: TypeSortie })
  @IsEnum(TypeSortie)
  type!: TypeSortie;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: '2000.00', description: 'Remise en montant absolu (FCFA)' })
  @IsOptional()
  @IsDecimal({ decimal_digits: '1,2' })
  remiseMontant?: string;

  @ApiPropertyOptional({ example: '2026-06-20', description: 'Date de l\'opération (non-VENTE uniquement)' })
  @IsOptional()
  @IsDateString()
  dateOperation?: string;

  @ApiProperty({ type: [CreateLigneSortieDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLigneSortieDto)
  lignes!: CreateLigneSortieDto[];
}
