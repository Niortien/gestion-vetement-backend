import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { QueryMouvementDto, QueryStockDto } from './dto/query-stock.dto';
import { StockService } from './stock.service';

function resolveBoutiqueId(user: AuthenticatedUser, queryBoutiqueId?: string): string | null {
  return user.role === 'ADMIN' ? (queryBoutiqueId ?? null) : user.boutiqueId;
}

@ApiTags('Stock')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  @ApiOperation({ summary: 'Lister le stock courant' })
  @ApiQuery({ name: 'alerte', required: false })
  @ApiQuery({ name: 'taille', required: false })
  @ApiQuery({ name: 'couleur', required: false })
  @ApiQuery({ name: 'categorieId', required: false })
  @ApiQuery({ name: 'boutiqueId', required: false })
  @ApiResponse({ status: 200, description: 'Liste paginee du stock' })
  async listStock(
    @Query() query: QueryStockDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const boutiqueId = resolveBoutiqueId(user, query.boutiqueId);
    return this.stockService.listStock(query, boutiqueId);
  }

  @Get('alertes')
  @ApiOperation({ summary: 'Lister les alertes de stock' })
  @ApiQuery({ name: 'boutiqueId', required: false })
  @ApiResponse({ status: 200, description: 'Variantes sous seuil' })
  async listAlertes(
    @Query('boutiqueId') queryBoutiqueId: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const boutiqueId = resolveBoutiqueId(user, queryBoutiqueId);
    return this.stockService.listAlertes(boutiqueId);
  }

  @Get('mouvements')
  @ApiOperation({ summary: 'Lister les mouvements de stock' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'dateDebut', required: false })
  @ApiQuery({ name: 'dateFin', required: false })
  @ApiQuery({ name: 'produitId', required: false })
  @ApiQuery({ name: 'boutiqueId', required: false })
  @ApiResponse({ status: 200, description: 'Mouvements pagines' })
  async listMouvements(
    @Query() query: QueryMouvementDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const boutiqueId = resolveBoutiqueId(user, query.boutiqueId);
    return this.stockService.listMouvements(query, boutiqueId);
  }
}
