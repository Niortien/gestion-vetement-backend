import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ModePaiement } from '@prisma/client';
import { IsDecimal, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({ example: '12000.00' })
  @IsDecimal({ decimal_digits: '1,2' })
  montant!: string;

  @ApiProperty({ enum: ModePaiement })
  @IsEnum(ModePaiement)
  modePaiement!: ModePaiement;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortieId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
