import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDecimal,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class UpdateProduitDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '12500.00' })
  @IsOptional()
  @IsDecimal({ decimal_digits: '1,2' })
  prixVente?: string;

  @ApiPropertyOptional({ example: '9000.00' })
  @IsOptional()
  @IsDecimal({ decimal_digits: '1,2' })
  prixAchat?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActif?: boolean;
}
