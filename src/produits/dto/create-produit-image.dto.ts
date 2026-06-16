import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateProduitImageDto {
  @ApiProperty({ description: 'URL ou data URL base64 de l image' })
  @IsString()
  url!: string;
}
