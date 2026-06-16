import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProduitsService } from './produits.service';
import { QueryProduitDto } from './dto/query-produit.dto';
import { CreateProduitDto } from './dto/create-produit.dto';
import { UpdateProduitDto } from './dto/update-produit.dto';
import { CreateProduitImageDto } from './dto/create-produit-image.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Produits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('produits')
export class ProduitsController {
  constructor(private readonly produitsService: ProduitsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les produits' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'categorieId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'isActif', required: false })
  @ApiResponse({ status: 200, description: 'Page paginee des produits' })
  async findAll(@Query() query: QueryProduitDto) {
    return this.produitsService.findAll(query);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Lister toutes les categories' })
  @ApiResponse({ status: 200, description: 'Liste des categories' })
  async findAllCategories() {
    return this.produitsService.findAllCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Recuperer un produit' })
  @ApiResponse({ status: 200, description: 'Produit avec variantes' })
  async findById(@Param('id') id: string) {
    return this.produitsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Creer un produit' })
  @ApiResponse({ status: 201, description: 'Produit cree' })
  async create(@Body() dto: CreateProduitDto) {
    return this.produitsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre a jour un produit' })
  @ApiResponse({ status: 200, description: 'Produit mis a jour' })
  async update(@Param('id') id: string, @Body() dto: UpdateProduitDto) {
    return this.produitsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer logiquement un produit' })
  @ApiResponse({ status: 200, description: 'Produit desactive' })
  async softDelete(@Param('id') id: string) {
    return this.produitsService.softDelete(id);
  }

  @Post(':id/images')
  @ApiOperation({ summary: 'Ajouter une image a un produit' })
  @ApiResponse({ status: 201, description: 'Image ajoutee' })
  async addImage(
    @Param('id') id: string,
    @Body() dto: CreateProduitImageDto,
  ) {
    return this.produitsService.addImage(id, dto.url);
  }

  @Delete(':id/images/:imageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une image d un produit' })
  @ApiResponse({ status: 204, description: 'Image supprimee' })
  async removeImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
  ) {
    return this.produitsService.removeImage(id, imageId);
  }

  @Get(':id/mouvements')
  @ApiOperation({ summary: 'Lister les mouvements d un produit' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Mouvements du produit' })
  async findMouvements(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.produitsService.findMouvements(id, Number(page), Number(limit));
  }
}
