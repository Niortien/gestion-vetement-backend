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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { CreateEntreeDto } from './dto/create-entree.dto';
import { QueryEntreeDto } from './dto/query-entree.dto';
import { UpdateEntreeDto } from './dto/update-entree.dto';
import { EntreesService } from './entrees.service';

function resolveBoutiqueId(user: AuthenticatedUser, queryBoutiqueId?: string): string | null {
  return user.role === 'ADMIN' ? (queryBoutiqueId ?? null) : user.boutiqueId;
}

@ApiTags('Entrees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('entrees')
export class EntreesController {
  constructor(private readonly entreesService: EntreesService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les entrees' })
  @ApiQuery({ name: 'dateDebut', required: false })
  @ApiQuery({ name: 'dateFin', required: false })
  @ApiQuery({ name: 'fournisseur', required: false })
  @ApiQuery({ name: 'boutiqueId', required: false })
  @ApiResponse({ status: 200 })
  async findAll(
    @Query() query: QueryEntreeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const boutiqueId = resolveBoutiqueId(user, query.boutiqueId);
    return this.entreesService.findAll(query, boutiqueId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Recuperer une entree' })
  @ApiResponse({ status: 200 })
  async findById(@Param('id') id: string) {
    return this.entreesService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Creer une entree + mouvements ENTREE atomiques' })
  @ApiQuery({ name: 'boutiqueId', required: false })
  @ApiResponse({ status: 201 })
  async create(
    @Body() dto: CreateEntreeDto,
    @CurrentUser() user: AuthenticatedUser,
    @Query('boutiqueId') queryBoutiqueId?: string,
  ) {
    const boutiqueId = resolveBoutiqueId(user, queryBoutiqueId);
    return this.entreesService.create(dto, user.id, boutiqueId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier le fournisseur ou les notes d une entree' })
  @ApiResponse({ status: 200 })
  async update(@Param('id') id: string, @Body() dto: UpdateEntreeDto) {
    return this.entreesService.update(id, dto);
  }

  @Patch(':id/annuler')
  @ApiOperation({ summary: 'Annuler une entree avec ajustements inverses' })
  @ApiResponse({ status: 200 })
  async annuler(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.entreesService.annuler(id, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une entree et inverser les mouvements de stock' })
  @ApiResponse({ status: 200 })
  async delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.entreesService.delete(id, user.id);
  }
}
