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

  async ventes(query: QueryRapportDto) {
    const transactions = await this.prisma.transaction.findMany({
      where: { createdAt: this.toDateRange(query) },
      orderBy: { createdAt: 'asc' },
    });

    const grouped = transactions.reduce<Record<string, string>>((acc, tx) => {
      const date = tx.createdAt;
      const key =
        query.groupBy === 'mois'
          ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          : query.groupBy === 'semaine'
            ? `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`
            : date.toISOString().slice(0, 10);
      const current = new Decimal(acc[key] ?? '0');
      acc[key] = current.plus(tx.montant.toString()).toFixed(2);
      return acc;
    }, {});

    return Object.entries(grouped).map(([periode, total]) => ({
      periode,
      total,
    }));
  }

  async stockValeur() {
    const variantes = await this.prisma.variante.findMany({
      include: { produit: true },
    });

    const total = variantes.reduce(
      (sum, v) =>
        sum.plus(
          new Decimal(v.produit.prixAchat.toString()).times(v.quantiteStock),
        ),
      new Decimal(0),
    );

    return { valeurStock: total.toFixed(2) };
  }

  async topProduits(query: QueryRapportDto) {
    const lignes = await this.prisma.ligneSortie.findMany({
      where: {
        sortie: {
          createdAt: this.toDateRange(query),
          type: 'VENTE',
        },
      },
      include: {
        variante: { include: { produit: true } },
      },
    });

    const grouped = lignes.reduce<
      Record<string, { nom: string; quantite: number }>
    >((acc, line) => {
      const key = line.variante.produitId;
      const current = acc[key] ?? {
        nom: line.variante.produit.nom,
        quantite: 0,
      };
      current.quantite += line.quantite;
      acc[key] = current;
      return acc;
    }, {});

    return Object.values(grouped)
      .sort((a, b) => b.quantite - a.quantite)
      .slice(0, 10);
  }

  async fluxTresorerie(query: QueryRapportDto) {
    const [transactions, sorties] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { createdAt: this.toDateRange(query) },
      }),
      this.prisma.sortie.findMany({
        where: { createdAt: this.toDateRange(query) },
      }),
    ]);

    const entrees = transactions.reduce(
      (sum, tx) => sum.plus(tx.montant.toString()),
      new Decimal(0),
    );
    const depenses = sorties.reduce(
      (sum, sortie) => sum.plus(sortie.totalMontant.toString()),
      new Decimal(0),
    );

    return {
      entreesCaisse: entrees.toFixed(2),
      sortiesCaisse: depenses.toFixed(2),
      net: entrees.minus(depenses).toFixed(2),
    };
  }

  async exportExcel(query: QueryRapportDto): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Ventes');
    sheet.addRow(['Periode', 'Total']);

    const ventes = await this.ventes(query);
    ventes.forEach((line) => sheet.addRow([line.periode, line.total]));

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
              ['Periode', 'Total'],
              ...ventes.map((v) => [v.periode, v.total]),
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
