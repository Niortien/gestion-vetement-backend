import { ApiProperty } from '@nestjs/swagger';
import { IsDecimal } from 'class-validator';

export class CloseCaisseDto {
  @ApiProperty({ example: '150000.00' })
  @IsDecimal({ decimal_digits: '1,2' })
  montantFermeture!: string;
}
