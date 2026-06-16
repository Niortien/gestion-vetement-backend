import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { QueryMouvementDto, QueryStockDto } from './dto/query-stock.dto';
import { StockService } from './stock.service';

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
  @ApiResponse({ status: 200, description: 'Liste paginee du stock' })
  async listStock(@Query() query: QueryStockDto) {
    return this.stockService.listStock(query);
  }

  @Get('alertes')
  @ApiOperation({ summary: 'Lister les alertes de stock' })
  @ApiResponse({ status: 200, description: 'Variantes sous seuil' })
  async listAlertes() {
    return this.stockService.listAlertes();
  }

  @Get('mouvements')
  @ApiOperation({ summary: 'Lister les mouvements de stock' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'dateDebut', required: false })
  @ApiQuery({ name: 'dateFin', required: false })
  @ApiQuery({ name: 'produitId', required: false })
  @ApiResponse({ status: 200, description: 'Mouvements pagines' })
  async listMouvements(@Query() query: QueryMouvementDto) {
    return this.stockService.listMouvements(query);
  }
}
