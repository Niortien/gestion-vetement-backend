import 'dotenv/config';
import { Prisma, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seed...');

  await prisma.transaction.deleteMany();
  await prisma.session.deleteMany();
  await prisma.mouvementStock.deleteMany();
  await prisma.ligneSortie.deleteMany();
  await prisma.ligneEntree.deleteMany();
  await prisma.sortie.deleteMany();
  await prisma.entree.deleteMany();
  await prisma.variante.deleteMany();
  await prisma.produit.deleteMany();
  await prisma.categorie.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('StrongPass123!', 12);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@shop.com',
      passwordHash,
      role: 'ADMIN',
    },
  });

  const vendeur = await prisma.user.create({
    data: {
      email: 'vendeur@shop.com',
      passwordHash,
      role: 'VENDEUR',
    },
  });

  const categories = await prisma.$transaction([
    prisma.categorie.create({
      data: {
        nom: 'Vêtements',
        slug: 'vetements',
        description: 'T-shirts, jeans et pulls',
      },
    }),
    prisma.categorie.create({
      data: {
        nom: 'Chaussures',
        slug: 'chaussures',
        description: 'Baskets et chaussures de ville',
      },
    }),
    prisma.categorie.create({
      data: {
        nom: 'Accessoires',
        slug: 'accessoires',
        description: 'Sacs, ceintures et bijoux',
      },
    }),
  ]);

  const [vetements, chaussures, accessoires] = categories;

  const produits = [] as Array<{ id: string; nom: string }>;

  const produit1 = await prisma.produit.create({
    data: {
      nom: 'T-shirt Premium',
      sku: 'TSH-001',
      description: 'T-shirt coton premium',
      categorieId: vetements.id,
      prixVente: new Prisma.Decimal('12500.00'),
      prixAchat: new Prisma.Decimal('8000.00'),
      imageUrl: 'https://images.example.com/tshirt.jpg',
    },
  });
  produits.push(produit1);

  const produit2 = await prisma.produit.create({
    data: {
      nom: 'Jean Slim',
      sku: 'JEA-002',
      description: 'Jean coupe slim',
      categorieId: vetements.id,
      prixVente: new Prisma.Decimal('18000.00'),
      prixAchat: new Prisma.Decimal('11000.00'),
      imageUrl: 'https://images.example.com/jean.jpg',
    },
  });
  produits.push(produit2);

  const produit3 = await prisma.produit.create({
    data: {
      nom: 'Basket Runner',
      sku: 'BAS-003',
      description: 'Basket confortable pour la ville',
      categorieId: chaussures.id,
      prixVente: new Prisma.Decimal('25000.00'),
      prixAchat: new Prisma.Decimal('15000.00'),
      imageUrl: 'https://images.example.com/basket.jpg',
    },
  });
  produits.push(produit3);

  const produit4 = await prisma.produit.create({
    data: {
      nom: 'Sac Cabas',
      sku: 'SAC-004',
      description: 'Sac cabas en toile',
      categorieId: accessoires.id,
      prixVente: new Prisma.Decimal('14000.00'),
      prixAchat: new Prisma.Decimal('9000.00'),
      imageUrl: 'https://images.example.com/sac.jpg',
    },
  });
  produits.push(produit4);

  const variantes = [] as Array<{ id: string }>;

  for (const payload of [
    {
      produitId: produit1.id,
      taille: 'M' as const,
      couleur: 'Noir',
      stock: 25,
      seuil: 5,
    },
    {
      produitId: produit1.id,
      taille: 'L' as const,
      couleur: 'Blanc',
      stock: 18,
      seuil: 4,
    },
    {
      produitId: produit2.id,
      taille: 'M' as const,
      couleur: 'Bleu',
      stock: 12,
      seuil: 3,
    },
    {
      produitId: produit3.id,
      taille: 'L' as const,
      couleur: 'Blanc',
      stock: 10,
      seuil: 3,
    },
    {
      produitId: produit3.id,
      taille: 'XL' as const,
      couleur: 'Noir',
      stock: 8,
      seuil: 2,
    },
    {
      produitId: produit4.id,
      taille: 'S' as const,
      couleur: 'Beige',
      stock: 7,
      seuil: 2,
    },
  ]) {
    const variante = await prisma.variante.create({
      data: {
        produitId: payload.produitId,
        taille: payload.taille,
        couleur: payload.couleur,
        quantiteStock: payload.stock,
        seuilAlerte: payload.seuil,
      },
    });
    variantes.push(variante);
  }

  const entree = await prisma.entree.create({
    data: {
      reference: 'ENT-2026-001',
      fournisseur: 'Grossiste Dakar',
      totalCout: new Prisma.Decimal('124000.00'),
      notes: 'Livraison initiale du mois',
      userId: admin.id,
      lignes: {
        create: [
          {
            varianteId: variantes[0].id,
            quantite: 20,
            prixUnitaire: new Prisma.Decimal('5000.00'),
          },
          {
            varianteId: variantes[2].id,
            quantite: 10,
            prixUnitaire: new Prisma.Decimal('7000.00'),
          },
          {
            varianteId: variantes[4].id,
            quantite: 8,
            prixUnitaire: new Prisma.Decimal('9000.00'),
          },
        ],
      },
    },
  });

  await prisma.mouvementStock.createMany({
    data: [
      {
        varianteId: variantes[0].id,
        type: 'ENTREE',
        quantite: 20,
        motif: 'Réception initiale',
        referenceEntree: entree.reference,
        userId: admin.id,
      },
      {
        varianteId: variantes[2].id,
        type: 'ENTREE',
        quantite: 10,
        motif: 'Réception initiale',
        referenceEntree: entree.reference,
        userId: admin.id,
      },
      {
        varianteId: variantes[4].id,
        type: 'ENTREE',
        quantite: 8,
        motif: 'Réception initiale',
        referenceEntree: entree.reference,
        userId: admin.id,
      },
    ],
  });

  await prisma.variante.update({
    where: { id: variantes[0].id },
    data: { quantiteStock: { increment: 20 } },
  });
  await prisma.variante.update({
    where: { id: variantes[2].id },
    data: { quantiteStock: { increment: 10 } },
  });
  await prisma.variante.update({
    where: { id: variantes[4].id },
    data: { quantiteStock: { increment: 8 } },
  });

  const session = await prisma.session.create({
    data: {
      userId: admin.id,
      dateOuverture: new Date(),
      montantOuverture: new Prisma.Decimal('100000.00'),
      statut: 'OUVERTE',
    },
  });

  const sortie = await prisma.sortie.create({
    data: {
      reference: 'SRT-2026-001',
      type: 'VENTE',
      totalMontant: new Prisma.Decimal('12500.00'),
      notes: 'Vente de démonstration',
      userId: vendeur.id,
      lignes: {
        create: [
          {
            varianteId: variantes[0].id,
            quantite: 2,
            prixUnitaire: new Prisma.Decimal('12500.00'),
          },
        ],
      },
    },
  });

  await prisma.mouvementStock.create({
    data: {
      varianteId: variantes[0].id,
      type: 'SORTIE',
      quantite: 2,
      motif: 'Vente démonstration',
      referenceSortie: sortie.reference,
      userId: vendeur.id,
    },
  });

  await prisma.variante.update({
    where: { id: variantes[0].id },
    data: { quantiteStock: { decrement: 2 } },
  });

  await prisma.transaction.create({
    data: {
      sessionId: session.id,
      sortieId: sortie.id,
      montant: new Prisma.Decimal('12500.00'),
      modePaiement: 'WAVE',
      reference: 'TRX-0001',
      notes: 'Paiement comptoir',
    },
  });

  console.log('✅ Seed terminé avec succès');
  console.log(`- Utilisateurs: ${2}`);
  console.log(`- Catégories: ${categories.length}`);
  console.log(`- Produits: ${produits.length}`);
  console.log(`- Variantes: ${variantes.length}`);
}

main()
  .catch((error) => {
    console.error('❌ Erreur lors du seed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
