import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { PrismaService } from '../prisma/prisma.service';
import { PageDto } from '../common/dto/pagination.dto';
import { NotFoundDomainException } from '../common/exceptions/domain.exception';
import { StockMovementService } from '../stock/stock-movement.service';
import { CreateEntreeDto } from './dto/create-entree.dto';
import { QueryEntreeDto } from './dto/query-entree.dto';

@Injectable()
export class EntreesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockMovementService: StockMovementService,
  ) {}

  private buildReference(): string {
    return `ENT-${Math.floor(Date.now() / 1000)}`;
  }

  async findAll(query: QueryEntreeDto): Promise<PageDto<unknown>> {
    const where: Prisma.EntreeWhereInput = {
      fournisseur: query.fournisseur
        ? { contains: query.fournisseur, mode: 'insensitive' }
        : undefined,
      createdAt:
        query.dateDebut || query.dateFin
          ? {
              gte: query.dateDebut ? new Date(query.dateDebut) : undefined,
              lte: query.dateFin ? new Date(query.dateFin) : undefined,
            }
          : undefined,
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.entree.count({ where }),
      this.prisma.entree.findMany({
        where,
        include: { lignes: true, user: true },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return new PageDto(data, total, query.page, query.limit);
  }

  async findById(id: string) {
    const entree = await this.prisma.entree.findUnique({
      where: { id },
      include: { lignes: { include: { variante: true } }, user: true },
    });

    if (!entree) {
      throw new NotFoundDomainException(
        'Entree introuvable',
        'ENTREE_NOT_FOUND',
        { entreeId: id },
      );
    }

    return entree;
  }

  async create(dto: CreateEntreeDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const total = dto.lignes.reduce(
        (sum, line) =>
          sum.plus(new Decimal(line.prixUnitaire).times(line.quantite)),
        new Decimal(0),
      );

      const entree = await tx.entree.create({
        data: {
          reference: this.buildReference(),
          fournisseur: dto.fournisseur,
          totalCout: new Prisma.Decimal(total.toFixed(2)),
          notes: dto.notes,
          userId,
          lignes: {
            create: dto.lignes.map((line) => ({
              varianteId: line.varianteId,
              quantite: line.quantite,
              prixUnitaire: new Prisma.Decimal(
                new Decimal(line.prixUnitaire).toFixed(2),
              ),
            })),
          },
        },
        include: { lignes: true },
      });

      for (const line of dto.lignes) {
        await this.stockMovementService.createMovement({
          varianteId: line.varianteId,
          type: 'ENTREE',
          quantite: line.quantite,
          userId,
          motif: `Entree ${entree.reference}`,
          referenceEntree: entree.reference,
          tx,
        });
      }

      return entree;
    });
  }

  async annuler(id: string, userId: string) {
    const entree = await this.findById(id);

    if (entree.notes?.includes('[ANNULEE]')) {
      return entree;
    }

    await this.prisma.$transaction(async (tx) => {
      for (const line of entree.lignes) {
        await this.stockMovementService.createMovement({
          varianteId: line.varianteId,
          type: 'AJUSTEMENT',
          quantite: line.quantite,
          userId,
          motif: `Annulation entree ${entree.reference}`,
          referenceEntree: entree.reference,
          tx,
        });
      }

      await tx.entree.update({
        where: { id: entree.id },
        data: {
          notes: entree.notes ? `${entree.notes} [ANNULEE]` : '[ANNULEE]',
        },
      });
    });

    return this.findById(id);
  }
}
