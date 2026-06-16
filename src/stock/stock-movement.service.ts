import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, TypeMouvementStock } from '@prisma/client';
import { ValidationDomainException } from '../common/exceptions/domain.exception';

@Injectable()
export class StockMovementService {
  private readonly logger = new Logger(StockMovementService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createMovement(params: {
    varianteId: string;
    type: TypeMouvementStock;
    quantite: number;
    userId: string;
    motif?: string;
    referenceEntree?: string;
    referenceSortie?: string;
    tx?: Prisma.TransactionClient;
  }): Promise<void> {
    const db = params.tx ?? this.prisma;

    const variante = await db.variante.findUnique({
      where: { id: params.varianteId },
    });

    if (!variante) {
      throw new ValidationDomainException(
        'Variante invalide',
        'VARIANTE_NOT_FOUND',
      );
    }

    const signe =
      params.type === TypeMouvementStock.ENTREE ||
      params.type === TypeMouvementStock.RETOUR
        ? 1
        : -1;
    const updatedStock = variante.quantiteStock + signe * params.quantite;

    if (updatedStock < 0) {
      throw new ValidationDomainException(
        'Stock insuffisant pour cette variante',
        'STOCK_NEGATIVE_FORBIDDEN',
        {
          varianteId: variante.id,
          stockActuel: variante.quantiteStock,
          quantiteDemandee: params.quantite,
        },
      );
    }

    await db.variante.update({
      where: { id: params.varianteId },
      data: { quantiteStock: updatedStock },
    });

    await db.mouvementStock.create({
      data: {
        varianteId: params.varianteId,
        type: params.type,
        quantite: params.quantite,
        motif: params.motif,
        userId: params.userId,
        referenceEntree: params.referenceEntree,
        referenceSortie: params.referenceSortie,
      },
    });

    if (updatedStock <= variante.seuilAlerte) {
      this.logger.warn({
        message: 'stock_critique_detecte',
        varianteId: variante.id,
        stockActuel: updatedStock,
        seuilAlerte: variante.seuilAlerte,
      });
    }
  }
}
