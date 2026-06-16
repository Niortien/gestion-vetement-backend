import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDecimal,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TailleVariante } from '@prisma/client';

class CreateVarianteDto {
  @ApiProperty({ enum: TailleVariante })
  @IsEnum(TailleVariante)
  taille!: TailleVariante;

  @ApiProperty()
  @IsString()
  couleur!: string;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  quantiteStock!: number;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  seuilAlerte!: number;
}

export class CreateProduitDto {
  @ApiProperty()
  @IsString()
  nom!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsString()
  categorieId!: string;

  @ApiProperty({ example: '12500.00' })
  @IsDecimal({ decimal_digits: '1,2' })
  prixVente!: string;

  @ApiProperty({ example: '9000.00' })
  @IsDecimal({ decimal_digits: '1,2' })
  prixAchat!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ type: [CreateVarianteDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVarianteDto)
  variantes?: CreateVarianteDto[];
}
