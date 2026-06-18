import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDecimal,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class NewProduitForEntreeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nom!: string;

  @ApiProperty()
  @IsUUID()
  categorieId!: string;

  @ApiProperty({ example: '12500.00' })
  @IsDecimal({ decimal_digits: '1,2' })
  prixVente!: string;

  @ApiProperty({ example: '9000.00' })
  @IsDecimal({ decimal_digits: '1,2' })
  prixAchat!: string;

  @ApiProperty({ example: 'M' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  taille!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  couleur!: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  seuilAlerte?: number;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}

class CreateLigneEntreeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  varianteId?: string;

  @ApiPropertyOptional({ type: NewProduitForEntreeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NewProduitForEntreeDto)
  newProduit?: NewProduitForEntreeDto;

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
