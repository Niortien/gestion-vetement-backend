import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { PrismaService } from '../prisma/prisma.service';
import { PageDto } from '../common/dto/pagination.dto';
import {
  ConflictDomainException,
  NotFoundDomainException,
} from '../common/exceptions/domain.exception';
import { CaisseGateway } from './caisse-gateway';
import { CloseCaisseDto } from './dto/close-caisse.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import {
  OpenSessionDto,
  QueryTransactionDto,
} from './dto/query-transaction.dto';

@Injectable()
export class CaisseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: CaisseGateway,
  ) {}

  async listSessions(query: QueryTransactionDto): Promise<PageDto<unknown>> {
    const [total, data] = await this.prisma.$transaction([
      this.prisma.session.count(),
      this.prisma.session.findMany({
        include: { user: true },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { dateOuverture: 'desc' },
      }),
    ]);

    return new PageDto(data, total, query.page, query.limit);
  }

  async getActiveSession() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return this.prisma.session.findFirst({
      where: {
        statut: 'OUVERTE',
        dateOuverture: { gte: todayStart },
      },
      include: { user: true },
      orderBy: { dateOuverture: 'desc' },
    });
  }

  async openSession(dto: OpenSessionDto, userId: string) {
    const active = await this.prisma.session.findFirst({
      where: { statut: 'OUVERTE' },
    });

    if (active) {
      throw new ConflictDomainException(
        'Une session est deja ouverte',
        'SESSION_ALREADY_OPEN',
        { sessionId: active.id },
      );
    }

    return this.prisma.session.create({
      data: {
        userId,
        dateOuverture: new Date(),
        montantOuverture: new Prisma.Decimal(
          new Decimal(dto.montantOuverture).toFixed(2),
        ),
        statut: 'OUVERTE',
      },
      include: { user: true },
    });
  }

  async closeSession(id: string, dto: CloseCaisseDto) {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: { transactions: true },
    });

    if (!session) {
      throw new NotFoundDomainException(
        'Session introuvable',
        'SESSION_NOT_FOUND',
      );
    }

    if (session.statut === 'FERMEE') {
      throw new ConflictDomainException(
        'La fermeture de caisse est irreversible',
        'SESSION_CLOSED',
      );
    }

    const closed = await this.prisma.session.update({
      where: { id },
      data: {
        statut: 'FERMEE',
        dateFermeture: new Date(),
        montantFermeture: new Prisma.Decimal(
          new Decimal(dto.montantFermeture).toFixed(2),
        ),
      },
      include: { transactions: true },
    });

    this.gateway.emitSessionClosed(closed);
    return closed;
  }

  async listTransactions(
    sessionId: string,
    query: QueryTransactionDto,
  ): Promise<PageDto<unknown>> {
    const where: Prisma.TransactionWhereInput = {
      sessionId,
      modePaiement: query.modePaiement,
      createdAt:
        query.dateDebut || query.dateFin
          ? {
              gte: query.dateDebut ? new Date(query.dateDebut) : undefined,
              lte: query.dateFin ? new Date(query.dateFin) : undefined,
            }
          : undefined,
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.transaction.count({ where }),
      this.prisma.transaction.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return new PageDto(data, total, query.page, query.limit);
  }

  async createTransaction(dto: CreateTransactionDto) {
    const active = await this.prisma.session.findFirst({
      where: { statut: 'OUVERTE' },
      orderBy: { dateOuverture: 'desc' },
    });

    if (!active) {
      throw new ConflictDomainException(
        'Impossible de creer une transaction: aucune session ouverte',
        'NO_ACTIVE_SESSION',
      );
    }

    const transaction = await this.prisma.transaction.create({
      data: {
        sessionId: active.id,
        sortieId: dto.sortieId,
        montant: new Prisma.Decimal(new Decimal(dto.montant).toFixed(2)),
        modePaiement: dto.modePaiement,
        reference: dto.reference,
        notes: dto.notes,
      },
    });

    this.gateway.emitTransaction(transaction);
    return transaction;
  }

  async resumeJour() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [transactions, entrees, sorties] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { createdAt: { gte: todayStart } },
      }),
      this.prisma.entree.findMany({
        where: { createdAt: { gte: todayStart } },
      }),
      this.prisma.sortie.findMany({
        where: { createdAt: { gte: todayStart } },
      }),
    ]);

    const totalVentes = transactions.reduce(
      (sum, tx) => sum.plus(tx.montant.toString()),
      new Decimal(0),
    );
    const totalEntrees = entrees.reduce(
      (sum, entry) => sum.plus(entry.totalCout.toString()),
      new Decimal(0),
    );
    const totalSorties = sorties.reduce(
      (sum, sortie) => sum.plus(sortie.totalMontant.toString()),
      new Decimal(0),
    );

    const grouped = transactions.reduce<Record<string, string>>((acc, tx) => {
      const current = new Decimal(acc[tx.modePaiement] ?? '0');
      acc[tx.modePaiement] = current.plus(tx.montant.toString()).toFixed(2);
      return acc;
    }, {});

    return {
      totalVentes: totalVentes.toFixed(2),
      totalEntrees: totalEntrees.toFixed(2),
      totalSorties: totalSorties.toFixed(2),
      soldeActuel: totalVentes
        .minus(totalSorties)
        .minus(totalEntrees)
        .toFixed(2),
      parModePaiement: grouped,
    };
  }
}
