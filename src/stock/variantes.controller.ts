import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TypeMouvementStock } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import {
  ConflictDomainException,
  ValidationDomainException,
} from '../common/exceptions/domain.exception';
import { StockMovementService } from './stock-movement.service';
import {
  AdjustVarianteStockDto,
  UpdateVarianteDto,
} from './dto/query-stock.dto';

@ApiTags('Variantes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('variantes')
export class VariantesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockMovementService: StockMovementService,
  ) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une variante (impossible si elle a des mouvements)' })
  @ApiResponse({ status: 204, description: 'Variante supprimee' })
  @ApiResponse({ status: 409, description: 'Variante liee a des mouvements de stock' })
  async deleteVariante(@Param('id') id: string) {
    const count = await this.prisma.mouvementStock.count({ where: { varianteId: id } });
    if (count > 0) {
      throw new ConflictDomainException(
        'Impossible de supprimer une variante avec des mouvements de stock',
        'VARIANTE_HAS_MOVEMENTS',
      );
    }
    return this.prisma.variante.delete({ where: { id } });
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Mettre a jour taille/couleur/seuil d une variante',
  })
  @ApiResponse({ status: 200 })
  async updateVariante(
    @Param('id') id: string,
    @Body() dto: UpdateVarianteDto,
  ) {
    return this.prisma.variante.update({
      where: { id },
      data: {
        taille: dto.taille,
        couleur: dto.couleur,
        seuilAlerte: dto.seuilAlerte,
      },
    });
  }

  @Patch(':id/stock')
  @ApiOperation({ summary: 'Ajuster manuellement le stock d une variante' })
  @ApiResponse({ status: 200 })
  async adjustStock(
    @Param('id') id: string,
    @Body() dto: AdjustVarianteStockDto,
    @CurrentUser() user: { id: string },
  ) {
    if (dto.variation === 0) {
      throw new ValidationDomainException(
        'Aucun ajustement a appliquer',
        'STOCK_NOOP',
      );
    }

    await this.stockMovementService.createMovement({
      varianteId: id,
      type: TypeMouvementStock.AJUSTEMENT,
      quantite: Math.abs(dto.variation),
      userId: user.id,
      motif: dto.motif ?? 'Ajustement manuel',
    });

    return this.prisma.variante.findUnique({ where: { id } });
  }
}
