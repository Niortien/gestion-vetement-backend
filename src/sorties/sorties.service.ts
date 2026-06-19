import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { PrismaService } from '../prisma/prisma.service';
import { PageDto } from '../common/dto/pagination.dto';
import {
  ConflictDomainException,
  NotFoundDomainException,
} from '../common/exceptions/domain.exception';
import { StockMovementService } from '../stock/stock-movement.service';
import { CreateSortieDto } from './dto/create-sortie.dto';
import { QuerySortieDto } from './dto/query-sortie.dto';
import { UpdateSortieDto } from './dto/update-sortie.dto';

@Injectable()
export class SortiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockMovementService: StockMovementService,
  ) {}

  private buildReference(): string {
    return `SOR-${Math.floor(Date.now() / 1000)}`;
  }

  async findAll(query: QuerySortieDto): Promise<PageDto<unknown>> {
    const where: Prisma.SortieWhereInput = {
      type: query.type,
      createdAt:
        query.dateDebut || query.dateFin
          ? {
              gte: query.dateDebut ? new Date(query.dateDebut) : undefined,
              lte: query.dateFin ? new Date(query.dateFin) : undefined,
            }
          : undefined,
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.sortie.count({ where }),
      this.prisma.sortie.findMany({
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
    const sortie = await this.prisma.sortie.findUnique({
      where: { id },
      include: {
        lignes: {
          include: { variante: { include: { produit: true } } },
        },
        user: true,
      },
    });

    if (!sortie) {
      throw new NotFoundDomainException(
        'Sortie introuvable',
        'SORTIE_NOT_FOUND',
        { sortieId: id },
      );
    }

    const transaction = await this.prisma.transaction.findFirst({
      where: { sortieId: id },
      select: { modePaiement: true, reference: true },
    });

    return { ...sortie, transaction: transaction ?? null };
  }

  async create(dto: CreateSortieDto, userId: string) {
    if (dto.type === 'VENTE') {
      const activeSession = await this.prisma.session.findFirst({
        where: { statut: 'OUVERTE' },
      });

      if (!activeSession) {
        throw new ConflictDomainException(
          'Une vente doit etre liee a une session de caisse ouverte',
          'SESSION_REQUIRED_FOR_VENTE',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const totalAvantRemise = dto.lignes.reduce(
        (sum, line) =>
          sum.plus(new Decimal(line.prixUnitaire).times(line.quantite)),
        new Decimal(0),
      );

      const remise = dto.remiseMontant
        ? new Decimal(dto.remiseMontant)
        : new Decimal(0);

      if (remise.gt(totalAvantRemise)) {
        throw new ConflictDomainException(
          'La remise ne peut pas dépasser le montant total',
          'REMISE_EXCEEDS_TOTAL',
        );
      }

      const total = totalAvantRemise.minus(remise);

      const sortie = await tx.sortie.create({
        data: {
          reference: this.buildReference(),
          type: dto.type,
          totalMontant: new Prisma.Decimal(total.toFixed(2)),
          ...(remise.gt(0)
            ? {
                remiseMontant: new Prisma.Decimal(remise.toFixed(2)),
                totalAvantRemise: new Prisma.Decimal(
                  totalAvantRemise.toFixed(2),
                ),
              }
            : {}),
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
          type: 'SORTIE',
          quantite: line.quantite,
          userId,
          motif: `Sortie ${sortie.reference}`,
          referenceSortie: sortie.reference,
          tx,
        });
      }

      return sortie;
    });
  }

  async update(id: string, dto: UpdateSortieDto) {
    await this.findById(id);
    return this.prisma.sortie.update({
      where: { id },
      data: {
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
  }

  async delete(id: string, userId: string) {
    const sortie = await this.findById(id);
    const alreadyAnnulee = sortie.notes?.includes('[ANNULEE]') ?? false;

    return this.prisma.$transaction(async (tx) => {
      if (!alreadyAnnulee) {
        for (const line of sortie.lignes) {
          await this.stockMovementService.createMovement({
            varianteId: line.varianteId,
            type: 'RETOUR',
            quantite: line.quantite,
            userId,
            motif: `Suppression sortie ${sortie.reference}`,
            referenceSortie: sortie.reference,
            tx,
          });
        }
      }
      await tx.ligneSortie.deleteMany({ where: { sortieId: id } });
      await tx.sortie.delete({ where: { id } });
    });
  }

  async annuler(id: string, userId: string) {
    const sortie = await this.findById(id);

    if (sortie.notes?.includes('[ANNULEE]')) {
      return sortie;
    }

    await this.prisma.$transaction(async (tx) => {
      for (const line of sortie.lignes) {
        await this.stockMovementService.createMovement({
          varianteId: line.varianteId,
          type: 'RETOUR',
          quantite: line.quantite,
          userId,
          motif: `Annulation sortie ${sortie.reference}`,
          referenceSortie: sortie.reference,
          tx,
        });
      }

      await tx.sortie.update({
        where: { id: sortie.id },
        data: {
          notes: sortie.notes ? `${sortie.notes} [ANNULEE]` : '[ANNULEE]',
        },
      });
    });

    return this.findById(id);
  }
}
