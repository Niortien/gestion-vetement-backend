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

  async listSessions(query: QueryTransactionDto, boutiqueId: string | null): Promise<PageDto<unknown>> {
    const where: Prisma.SessionWhereInput = {
      ...(boutiqueId ? { boutiqueId } : {}),
    };

    if (query.dateDebut || query.dateFin) {
      where.dateOuverture = {
        ...(query.dateDebut ? { gte: new Date(query.dateDebut) } : {}),
        ...(query.dateFin ? { lte: new Date(query.dateFin) } : {}),
      };
    }

    const [total, data] = await this.prisma.$transaction([
      this.prisma.session.count({ where }),
      this.prisma.session.findMany({
        where,
        include: { user: true, boutique: true },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { dateOuverture: 'desc' },
      }),
    ]);

    return new PageDto(data, total, query.page, query.limit);
  }

  async getActiveSession(boutiqueId: string | null) {
    return this.prisma.session.findFirst({
      where: { statut: 'OUVERTE', ...(boutiqueId ? { boutiqueId } : {}) },
      include: { user: true, boutique: true },
      orderBy: { dateOuverture: 'desc' },
    });
  }

  async openSession(dto: OpenSessionDto, userId: string, boutiqueId: string | null) {
    const active = await this.prisma.session.findFirst({
      where: { statut: 'OUVERTE', ...(boutiqueId ? { boutiqueId } : {}) },
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
        ...(boutiqueId ? { boutiqueId } : {}),
        dateOuverture: new Date(),
        montantOuverture: new Prisma.Decimal(
          new Decimal(dto.montantOuverture ?? '0').toFixed(2),
        ),
        statut: 'OUVERTE',
      },
      include: { user: true, boutique: true },
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

  async createTransaction(dto: CreateTransactionDto, boutiqueId: string | null) {
    const active = await this.prisma.session.findFirst({
      where: { statut: 'OUVERTE', ...(boutiqueId ? { boutiqueId } : {}) },
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

  async resumeJour(boutiqueId: string | null) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const boutiqueFilter = boutiqueId ? { boutiqueId } : {};

    const [transactions, achats, session] = await Promise.all([
      this.prisma.transaction.findMany({
        where: {
          createdAt: { gte: todayStart },
          ...(boutiqueId ? { session: { boutiqueId } } : {}),
        },
      }),
      this.prisma.entree.findMany({
        where: { createdAt: { gte: todayStart }, ...boutiqueFilter },
      }),
      this.prisma.session.findFirst({
        where: { statut: 'OUVERTE', ...boutiqueFilter },
        orderBy: { dateOuverture: 'desc' },
      }),
    ]);

    const totalVentes = transactions.reduce(
      (sum, tx) => sum.plus(tx.montant.toString()),
      new Decimal(0),
    );
    const totalAchats = achats.reduce(
      (sum, e) => sum.plus(e.totalCout.toString()),
      new Decimal(0),
    );
    const beneficeNet = totalVentes.minus(totalAchats);

    const parModePaiement = transactions.reduce<Record<string, string>>(
      (acc, tx) => {
        const current = new Decimal(acc[tx.modePaiement] ?? '0');
        acc[tx.modePaiement] = current.plus(tx.montant.toString()).toFixed(2);
        return acc;
      },
      {},
    );

    return {
      session: session
        ? {
            id: session.id,
            statut: session.statut,
            montantOuverture: session.montantOuverture.toString(),
            dateOuverture: session.dateOuverture.toISOString(),
          }
        : null,
      totalVentes: totalVentes.toFixed(2),
      totalTransactions: transactions.length,
      totalAchats: totalAchats.toFixed(2),
      beneficeNet: beneficeNet.toFixed(2),
      parModePaiement,
    };
  }
}
