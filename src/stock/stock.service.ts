import { Injectable } from '@nestjs/common';
import { Prisma, TypeMouvementStock } from '@prisma/client';
import { PageDto } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { QueryMouvementDto, QueryStockDto } from './dto/query-stock.dto';

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  async listStock(query: QueryStockDto): Promise<PageDto<unknown>> {
    const where: Prisma.VarianteWhereInput = {
      produit: {
        isActif: true,
        ...(query.categorieId ? { categorieId: query.categorieId } : {}),
      },
      taille: query.taille,
      couleur: query.couleur
        ? { contains: query.couleur, mode: 'insensitive' }
        : undefined,
      ...(query.alerte
        ? { quantiteStock: { lte: this.prisma.variante.fields.seuilAlerte } }
        : {}),
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.variante.count({ where }),
      this.prisma.variante.findMany({
        where,
        include: { produit: true },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);

    return new PageDto(data, total, query.page, query.limit);
  }

  async listAlertes(): Promise<unknown[]> {
    return this.prisma.variante.findMany({
      where: {
        quantiteStock: { lte: this.prisma.variante.fields.seuilAlerte },
        produit: { isActif: true },
      },
      include: { produit: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async listMouvements(query: QueryMouvementDto): Promise<PageDto<unknown>> {
    const where: Prisma.MouvementStockWhereInput = {
      type: query.type,
      createdAt:
        query.dateDebut || query.dateFin
          ? {
              gte: query.dateDebut ? new Date(query.dateDebut) : undefined,
              lte: query.dateFin ? new Date(query.dateFin) : undefined,
            }
          : undefined,
      variante: query.produitId ? { produitId: query.produitId } : undefined,
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.mouvementStock.count({ where }),
      this.prisma.mouvementStock.findMany({
        where,
        include: { variante: { include: { produit: true } }, user: true },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return new PageDto(data, total, query.page, query.limit);
  }
}
