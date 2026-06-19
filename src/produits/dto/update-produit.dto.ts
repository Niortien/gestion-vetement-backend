import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsDecimal,
  IsOptional,
  IsString,
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enPromo?: boolean;

  @ApiPropertyOptional({ example: '9500.00' })
  @IsOptional()
  @IsDecimal({ decimal_digits: '1,2' })
  prixPromo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateDebutPromo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFinPromo?: string;
}
