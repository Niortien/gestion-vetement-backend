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
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { ProduitsService } from './produits.service';
import { QueryProduitDto } from './dto/query-produit.dto';
import { CreateProduitDto } from './dto/create-produit.dto';
import { UpdateProduitDto } from './dto/update-produit.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

function resolveBoutiqueId(
  user: AuthenticatedUser | undefined,
  queryBoutiqueId?: string,
): string | undefined {
  if (!user) return undefined; // vitrine publique → pas de filtre boutique
  if (user.role !== 'ADMIN') return user.boutiqueId ?? undefined;
  return queryBoutiqueId ?? undefined;
}

@ApiTags('Produits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('produits')
export class ProduitsController {
  constructor(private readonly produitsService: ProduitsService) {}

  // Lecture publique — le guard tente une auth optionnelle grâce au JwtAuthGuard modifié
  @Public()
  @Get()
  @ApiOperation({ summary: 'Lister les produits' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'categorieId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'isActif', required: false })
  @ApiQuery({ name: 'boutiqueId', required: false })
  @ApiResponse({ status: 200, description: 'Page paginee des produits' })
  async findAll(
    @Query() query: QueryProduitDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    query.boutiqueId = resolveBoutiqueId(user, query.boutiqueId);
    return this.produitsService.findAll(query);
  }

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'Lister toutes les categories' })
  @ApiResponse({ status: 200, description: 'Liste des categories' })
  async findAllCategories() {
    return this.produitsService.findAllCategories();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Recuperer un produit' })
  @ApiResponse({ status: 200, description: 'Produit avec variantes' })
  async findById(@Param('id') id: string) {
    return this.produitsService.findById(id);
  }

  // Création — vendeur (lié à sa boutique) ou admin (boutique libre)
  @Post()
  @ApiOperation({ summary: 'Creer un produit' })
  @ApiQuery({ name: 'boutiqueIds', required: false, description: 'Admin : IDs boutiques séparés par virgule (vide = catalogue global)' })
  @ApiResponse({ status: 201, description: 'Produit cree' })
  async create(
    @Body() dto: CreateProduitDto,
    @CurrentUser() user: AuthenticatedUser,
    @Query('boutiqueIds') queryBoutiqueIds?: string,
  ) {
    // VENDEUR → toujours sa propre boutique depuis le JWT
    // ADMIN → boutiqueIds du query param (virgule séparée), vide = catalogue global
    let boutiqueIds: string[];
    if (user.role !== 'ADMIN') {
      boutiqueIds = user.boutiqueId ? [user.boutiqueId] : [];
    } else {
      boutiqueIds = queryBoutiqueIds
        ? queryBoutiqueIds.split(',').map((id) => id.trim()).filter(Boolean)
        : [];
    }
    return this.produitsService.create(dto, boutiqueIds);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Mettre a jour un produit (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Produit mis a jour' })
  @ApiResponse({ status: 403, description: 'Réservé aux admins' })
  async update(@Param('id') id: string, @Body() dto: UpdateProduitDto) {
    return this.produitsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Supprimer logiquement un produit (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Produit desactive' })
  @ApiResponse({ status: 403, description: 'Réservé aux admins' })
  async softDelete(@Param('id') id: string) {
    return this.produitsService.softDelete(id);
  }

  @Post(':id/images')
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: 'Ajouter une image a un produit (ADMIN)' })
  @ApiResponse({ status: 201, description: 'Image ajoutee' })
  async addImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Fichier image requis');
    return this.produitsService.addImage(id, file);
  }

  @Delete(':id/images/:imageId')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une image d un produit (ADMIN)' })
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
