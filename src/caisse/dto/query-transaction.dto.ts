import { ApiPropertyOptional } from '@nestjs/swagger';
import { ModePaiement } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryTransactionDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ModePaiement })
  @IsOptional()
  @IsEnum(ModePaiement)
  modePaiement?: ModePaiement;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateDebut?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFin?: string;
}

export class OpenSessionDto {
  @ApiPropertyOptional({ example: '100000.00' })
  montantOuverture = '0.00';
}
