import { Injectable } from '@nestjs/common';
import { Prisma, Produit } from '@prisma/client';
import Decimal from 'decimal.js';
import { PrismaService } from '../prisma/prisma.service';
import { PageDto } from '../common/dto/pagination.dto';
import { NotFoundDomainException } from '../common/exceptions/domain.exception';
import { QueryProduitDto } from './dto/query-produit.dto';
import { CreateProduitDto } from './dto/create-produit.dto';
import { UpdateProduitDto } from './dto/update-produit.dto';

const PRODUIT_INCLUDE = {
  variantes: true,
  categorie: true,
  images: { orderBy: { ordre: 'asc' as const } },
} as const;

@Injectable()
export class ProduitsService {
  constructor(private readonly prisma: PrismaService) {}

  private generateSku(categorieSlug: string): string {
    return `VET-${categorieSlug.toUpperCase().slice(0, 3)}-${Math.floor(Date.now() / 1000)}`;
  }

  async findAllCategories() {
    return this.prisma.categorie.findMany({
      orderBy: { nom: 'asc' },
    });
  }

  async findAll(query: QueryProduitDto): Promise<PageDto<Produit>> {
    const where: Prisma.ProduitWhereInput = {
      categorieId: query.categorieId,
      isActif: query.isActif,
      ...(query.search
        ? {
            OR: [
              { nom: { contains: query.search, mode: 'insensitive' } },
              { sku: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.produit.count({ where }),
      this.prisma.produit.findMany({
        where,
        include: PRODUIT_INCLUDE,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: {
          [query.sortBy]: query.sortOrder,
        },
      }),
    ]);

    return new PageDto(data, total, query.page, query.limit);
  }

  async findById(id: string): Promise<Produit> {
    const produit = await this.prisma.produit.findUnique({
      where: { id },
      include: PRODUIT_INCLUDE,
    });

    if (!produit) {
      throw new NotFoundDomainException(
        'Produit introuvable',
        'PRODUIT_NOT_FOUND',
        {
          produitId: id,
        },
      );
    }

    return produit;
  }

  async create(dto: CreateProduitDto): Promise<Produit> {
    const categorie = await this.prisma.categorie.findUnique({
      where: { id: dto.categorieId },
    });

    if (!categorie) {
      throw new NotFoundDomainException(
        'Categorie introuvable',
        'CATEGORIE_NOT_FOUND',
      );
    }

    return this.prisma.produit.create({
      data: {
        nom: dto.nom,
        sku: dto.sku ?? this.generateSku(categorie.slug),
        description: dto.description,
        categorieId: dto.categorieId,
        prixVente: new Prisma.Decimal(new Decimal(dto.prixVente).toFixed(2)),
        prixAchat: new Prisma.Decimal(new Decimal(dto.prixAchat).toFixed(2)),
        imageUrl: dto.imageUrl,
        variantes: dto.variantes
          ? {
              create: dto.variantes.map((v) => ({
                taille: v.taille,
                couleur: v.couleur,
                quantiteStock: v.quantiteStock,
                seuilAlerte: v.seuilAlerte,
              })),
            }
          : undefined,
      },
      include: PRODUIT_INCLUDE,
    });
  }

  async update(id: string, dto: UpdateProduitDto): Promise<Produit> {
    await this.findById(id);

    return this.prisma.produit.update({
      where: { id },
      data: {
        nom: dto.nom,
        description: dto.description,
        prixVente: dto.prixVente
          ? new Prisma.Decimal(new Decimal(dto.prixVente).toFixed(2))
          : undefined,
        prixAchat: dto.prixAchat
          ? new Prisma.Decimal(new Decimal(dto.prixAchat).toFixed(2))
          : undefined,
        imageUrl: dto.imageUrl,
        isActif: dto.isActif,
      },
      include: PRODUIT_INCLUDE,
    });
  }

  async softDelete(id: string): Promise<Produit> {
    await this.findById(id);

    return this.prisma.produit.update({
      where: { id },
      data: { isActif: false },
    });
  }

  async addImage(produitId: string, url: string) {
    await this.findById(produitId);
    return this.prisma.produitImage.create({ data: { produitId, url } });
  }

  async removeImage(produitId: string, imageId: string) {
    const img = await this.prisma.produitImage.findUnique({ where: { id: imageId } });
    if (!img || img.produitId !== produitId) {
      throw new NotFoundDomainException('Image introuvable', 'IMAGE_NOT_FOUND');
    }
    return this.prisma.produitImage.delete({ where: { id: imageId } });
  }

  async findMouvements(
    id: string,
    page: number,
    limit: number,
  ): Promise<PageDto<unknown>> {
    await this.findById(id);

    const where = {
      variante: {
        produitId: id,
      },
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.mouvementStock.count({ where }),
      this.prisma.mouvementStock.findMany({
        where,
        include: { variante: true, user: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return new PageDto(data, total, page, limit);
  }
}
