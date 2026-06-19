import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import ExcelJS from 'exceljs';
import PdfPrinter from 'pdfmake';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { PrismaService } from '../prisma/prisma.service';
import { QueryRapportDto } from './dto/query-rapport.dto';

@Injectable()
export class RapportsService {
  constructor(private readonly prisma: PrismaService) {}

  private toDateRange(query: QueryRapportDto): { gte?: Date; lte?: Date } {
    return {
      gte: query.dateDebut ? new Date(query.dateDebut) : undefined,
      lte: query.dateFin ? new Date(query.dateFin) : undefined,
    };
  }

  private periodKey(date: Date, groupBy?: string): string {
    if (groupBy === 'mois') {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
    }
    if (groupBy === 'semaine') {
      const day = date.getDay() || 7;
      const monday = new Date(date);
      monday.setDate(date.getDate() - day + 1);
      return monday.toISOString().slice(0, 10);
    }
    return date.toISOString().slice(0, 10);
  }

  async ventes(query: QueryRapportDto) {
    const range = this.toDateRange(query);
    const boutiqueId = query.boutiqueId ?? null;

    const [sorties, transactions] = await Promise.all([
      this.prisma.sortie.findMany({
        where: {
          type: 'VENTE',
          createdAt: range,
          ...(boutiqueId ? { boutiqueId } : {}),
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.transaction.findMany({
        where: {
          createdAt: range,
          ...(boutiqueId ? { session: { boutiqueId } } : {}),
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const grouped: Record<
      string,
      { totalVentes: Decimal; nombreSorties: number; nombreTransactions: number }
    > = {};

    for (const s of sorties) {
      const key = this.periodKey(s.createdAt, query.groupBy);
      const cur = grouped[key] ?? {
        totalVentes: new Decimal(0),
        nombreSorties: 0,
        nombreTransactions: 0,
      };
      cur.totalVentes = cur.totalVentes.plus(s.totalMontant.toString());
      cur.nombreSorties += 1;
      grouped[key] = cur;
    }

    for (const tx of transactions) {
      const key = this.periodKey(tx.createdAt, query.groupBy);
      const cur = grouped[key] ?? {
        totalVentes: new Decimal(0),
        nombreSorties: 0,
        nombreTransactions: 0,
      };
      cur.nombreTransactions += 1;
      grouped[key] = cur;
    }

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([periode, v]) => ({
        periode,
        totalVentes: v.totalVentes.toFixed(2),
        nombreTransactions: v.nombreTransactions,
        nombreSorties: v.nombreSorties,
      }));
  }

  async stockValeur(boutiqueId?: string | null) {
    const variantes = await this.prisma.variante.findMany({
      where: boutiqueId ? { boutiqueId } : undefined,
      include: { produit: true },
    });

    const valeurTotaleAchat = variantes.reduce(
      (sum, v) =>
        sum.plus(
          new Decimal(v.produit.prixAchat.toString()).times(v.quantiteStock),
        ),
      new Decimal(0),
    );

    const valeurTotaleVente = variantes.reduce(
      (sum, v) =>
        sum.plus(
          new Decimal(v.produit.prixVente.toString()).times(v.quantiteStock),
        ),
      new Decimal(0),
    );

    const produitIds = new Set(variantes.map((v) => v.produitId));

    return {
      valeurTotaleAchat: valeurTotaleAchat.toFixed(2),
      valeurTotaleVente: valeurTotaleVente.toFixed(2),
      nombreVariantes: variantes.length,
      nombreProduits: produitIds.size,
    };
  }

  async topProduits(query: QueryRapportDto) {
    const boutiqueId = query.boutiqueId ?? null;
    const lignes = await this.prisma.ligneSortie.findMany({
      where: {
        sortie: {
          createdAt: this.toDateRange(query),
          type: 'VENTE',
          ...(boutiqueId ? { boutiqueId } : {}),
        },
      },
      include: {
        variante: { include: { produit: true } },
      },
    });

    const grouped: Record<
      string,
      { nom: string; sku: string; quantiteTotale: number; montantTotal: Decimal }
    > = {};

    for (const line of lignes) {
      const key = line.variante.produitId;
      const cur = grouped[key] ?? {
        nom: line.variante.produit.nom,
        sku: line.variante.produit.sku,
        quantiteTotale: 0,
        montantTotal: new Decimal(0),
      };
      cur.quantiteTotale += line.quantite;
      cur.montantTotal = cur.montantTotal.plus(
        new Decimal(line.prixUnitaire.toString()).times(line.quantite),
      );
      grouped[key] = cur;
    }

    return Object.entries(grouped)
      .map(([produitId, v]) => ({
        produitId,
        nom: v.nom,
        sku: v.sku,
        quantiteTotale: v.quantiteTotale,
        montantTotal: v.montantTotal.toFixed(2),
      }))
      .sort((a, b) => b.quantiteTotale - a.quantiteTotale)
      .slice(0, 10);
  }

  async fluxTresorerie(query: QueryRapportDto) {
    const range = this.toDateRange(query);
    const boutiqueId = query.boutiqueId ?? null;

    // entrees de trésorerie = argent reçu (transactions de vente)
    const transactions = await this.prisma.transaction.findMany({
      where: {
        createdAt: range,
        ...(boutiqueId ? { session: { boutiqueId } } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });

    // sorties de trésorerie = achats fournisseurs (entrées de stock)
    const achats = await this.prisma.entree.findMany({
      where: {
        createdAt: range,
        ...(boutiqueId ? { boutiqueId } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });

    const grouped: Record<string, { entrees: Decimal; sorties: Decimal }> = {};

    for (const tx of transactions) {
      const key = this.periodKey(tx.createdAt, query.groupBy);
      const cur = grouped[key] ?? { entrees: new Decimal(0), sorties: new Decimal(0) };
      cur.entrees = cur.entrees.plus(tx.montant.toString());
      grouped[key] = cur;
    }

    for (const achat of achats) {
      const key = this.periodKey(achat.createdAt, query.groupBy);
      const cur = grouped[key] ?? { entrees: new Decimal(0), sorties: new Decimal(0) };
      cur.sorties = cur.sorties.plus(achat.totalCout.toString());
      grouped[key] = cur;
    }

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([periode, v]) => ({
        periode,
        entrees: v.entrees.toFixed(2),
        sorties: v.sorties.toFixed(2),
        solde: v.entrees.minus(v.sorties).toFixed(2),
      }));
  }

  async exportExcel(query: QueryRapportDto): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Ventes');
    sheet.addRow(['Periode', 'Total ventes', 'Nb transactions']);

    const ventes = await this.ventes(query);
    ventes.forEach((line) =>
      sheet.addRow([line.periode, line.totalVentes, line.nombreTransactions]),
    );

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportPdf(query: QueryRapportDto): Promise<Buffer> {
    const fonts = {
      Roboto: {
        normal: 'node_modules/pdfmake/fonts/Roboto-Regular.ttf',
        bold: 'node_modules/pdfmake/fonts/Roboto-Medium.ttf',
        italics: 'node_modules/pdfmake/fonts/Roboto-Italic.ttf',
        bolditalics: 'node_modules/pdfmake/fonts/Roboto-MediumItalic.ttf',
      },
    };

    const printer = new PdfPrinter(fonts);
    const ventes = await this.ventes(query);

    const docDefinition: TDocumentDefinitions = {
      content: [
        { text: 'Rapport des ventes', style: 'header' },
        {
          table: {
            body: [
              ['Periode', 'Total ventes', 'Nb transactions'],
              ...ventes.map((v) => [v.periode, v.totalVentes, v.nombreTransactions]),
            ],
          },
        },
      ],
      styles: {
        header: { fontSize: 18, bold: true },
      },
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', (error: Error) => reject(error));
      pdfDoc.end();
    });
  }
}
