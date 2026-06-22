import { ApiProperty } from '@nestjs/swagger';

export class CreateProduitImageDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'Fichier image' })
  file!: Express.Multer.File;
}
