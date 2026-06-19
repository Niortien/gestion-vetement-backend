import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { QueryRapportDto } from './dto/query-rapport.dto';
import { RapportsService } from './rapports.service';

function resolveBoutiqueId(user: AuthenticatedUser, queryBoutiqueId?: string): string | null {
  return user.role === 'ADMIN' ? (queryBoutiqueId ?? null) : user.boutiqueId;
}

@ApiTags('Rapports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rapports')
export class RapportsController {
  constructor(private readonly rapportsService: RapportsService) {}

  @Get('ventes')
  @ApiOperation({ summary: 'Rapport des ventes' })
  @ApiQuery({ name: 'dateDebut', required: false })
  @ApiQuery({ name: 'dateFin', required: false })
  @ApiQuery({ name: 'groupBy', required: false })
  @ApiQuery({ name: 'boutiqueId', required: false })
  @ApiResponse({ status: 200 })
  async ventes(
    @Query() query: QueryRapportDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    query.boutiqueId = resolveBoutiqueId(user, query.boutiqueId) ?? undefined;
    return this.rapportsService.ventes(query);
  }

  @Get('stock-valeur')
  @ApiOperation({ summary: 'Valeur totale du stock' })
  @ApiQuery({ name: 'boutiqueId', required: false })
  @ApiResponse({ status: 200 })
  async stockValeur(
    @Query('boutiqueId') queryBoutiqueId: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const boutiqueId = resolveBoutiqueId(user, queryBoutiqueId);
    return this.rapportsService.stockValeur(boutiqueId);
  }

  @Get('top-produits')
  @ApiOperation({ summary: 'Top 10 produits vendus' })
  @ApiQuery({ name: 'boutiqueId', required: false })
  @ApiResponse({ status: 200 })
  async topProduits(
    @Query() query: QueryRapportDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    query.boutiqueId = resolveBoutiqueId(user, query.boutiqueId) ?? undefined;
    return this.rapportsService.topProduits(query);
  }

  @Get('flux-tresorerie')
  @ApiOperation({ summary: 'Flux de tresorerie' })
  @ApiQuery({ name: 'boutiqueId', required: false })
  @ApiResponse({ status: 200 })
  async fluxTresorerie(
    @Query() query: QueryRapportDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    query.boutiqueId = resolveBoutiqueId(user, query.boutiqueId) ?? undefined;
    return this.rapportsService.fluxTresorerie(query);
  }

  @Get('export/excel')
  @ApiOperation({ summary: 'Exporter un rapport Excel' })
  @ApiResponse({ status: 200 })
  async exportExcel(@Query() query: QueryRapportDto, @Res() res: Response) {
    const file = await this.rapportsService.exportExcel(query);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="rapport-ventes.xlsx"',
    );
    res.send(file);
  }

  @Get('export/pdf')
  @ApiOperation({ summary: 'Exporter un rapport PDF' })
  @ApiResponse({ status: 200 })
  async exportPdf(@Query() query: QueryRapportDto, @Res() res: Response) {
    const file = await this.rapportsService.exportPdf(query);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="rapport-ventes.pdf"',
    );
    res.send(file);
  }
}
