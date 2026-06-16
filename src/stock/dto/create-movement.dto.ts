import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeMouvementStock } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateMovementDto {
  @ApiProperty()
  @IsString()
  varianteId!: string;

  @ApiProperty({ enum: TypeMouvementStock })
  @IsEnum(TypeMouvementStock)
  type!: TypeMouvementStock;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  quantite!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  motif?: string;
}
