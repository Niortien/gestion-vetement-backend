import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDecimal,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class CreateLigneEntreeDto {
  @ApiProperty()
  @IsString()
  varianteId!: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  quantite!: number;

  @ApiProperty({ example: '5000.00' })
  @IsDecimal({ decimal_digits: '1,2' })
  prixUnitaire!: string;
}

export class CreateEntreeDto {
  @ApiProperty()
  @IsString()
  fournisseur!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreateLigneEntreeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLigneEntreeDto)
  lignes!: CreateLigneEntreeDto[];
}
