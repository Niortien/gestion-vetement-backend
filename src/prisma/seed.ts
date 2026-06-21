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
    data: { email: 'admin@shop.com', passwordHash, role: 'ADMIN' },
  });

  const vendeur = await prisma.user.create({
    data: { email: 'vendeur@shop.com', passwordHash, role: 'VENDEUR' },
  });

  // ─── Catégories ────────────────────────────────────────────────────────────
  const catDefs = [
    // Hauts
    { nom: 'Tee-shirt',          slug: 'tee-shirt',             description: 'Hauts' },
    { nom: 'Polo',               slug: 'polo',                  description: 'Hauts' },
    { nom: 'Polo corp',          slug: 'polo-corp',             description: 'Hauts' },
    { nom: 'Polo sans col',      slug: 'polo-sans-col',         description: 'Hauts' },
    { nom: 'Polo cardigan',      slug: 'polo-cardigan',         description: 'Hauts' },
    { nom: 'Déambré',            slug: 'deambre',               description: 'Hauts' },
    { nom: 'Débardeur',          slug: 'debardeur',             description: 'Hauts' },
    // Chemises & Vestes
    { nom: 'Chemise simple',     slug: 'chemise-simple',        description: 'Chemises & Vestes' },
    { nom: 'Chemise croppée',    slug: 'chemise-crope',         description: 'Chemises & Vestes' },
    { nom: 'Djaket',             slug: 'djaket',                description: 'Chemises & Vestes' },
    { nom: 'Doudoune',           slug: 'doudoune',              description: 'Chemises & Vestes' },
    // Tenues
    { nom: 'Complet-culotte',    slug: 'complet-culotte',       description: 'Tenues' },
    { nom: 'Complet-pantalon',   slug: 'complet-pantalon',      description: 'Tenues' },
    { nom: 'Complet-pull',       slug: 'complet-pull',          description: 'Tenues' },
    { nom: 'Complet sous-vêtement', slug: 'complet-sous-vetement', description: 'Tenues' },
    // Pulls & Maillots
    { nom: 'Pull simple',        slug: 'pull-simple',           description: 'Pulls & Maillots' },
    { nom: 'Pull cardigan',      slug: 'pull-cardigan',         description: 'Pulls & Maillots' },
    { nom: 'Maillot de foot',    slug: 'maillot-foot',          description: 'Pulls & Maillots' },
    { nom: 'Maillot de basket',  slug: 'maillot-basket',        description: 'Pulls & Maillots' },
    // Bas
    { nom: 'Pantalon tissu',     slug: 'pantalon-tissu',        description: 'Bas' },
    { nom: 'Pantalon docker',    slug: 'pantalon-docker',       description: 'Bas' },
    { nom: 'Jogging',            slug: 'jogging',               description: 'Bas' },
    // Chaussures
    { nom: 'Basket',             slug: 'basket',                description: 'Chaussures' },
    { nom: 'Barbouche',          slug: 'barbouche',             description: 'Chaussures' },
    { nom: 'Cross',              slug: 'cross',                 description: 'Chaussures' },
    { nom: 'Soulier',            slug: 'soulier',               description: 'Chaussures' },
    { nom: 'Sandale',            slug: 'sandale',               description: 'Chaussures' },
    { nom: 'Claquette',          slug: 'claquette',             description: 'Chaussures' },
    // Sacs & Divers
    { nom: 'Sac',                slug: 'sac',                   description: 'Sacs & Divers' },
    { nom: 'Chaussettes',        slug: 'chaussettes',           description: 'Sacs & Divers' },
    { nom: 'Chocoto',            slug: 'chocoto',               description: 'Sacs & Divers' },
    // Parfum & Bijoux
    { nom: 'Parfum',             slug: 'parfum',                description: 'Parfum & Bijoux' },
    { nom: 'Montre',             slug: 'montre',                description: 'Parfum & Bijoux' },
    { nom: 'Lunette',            slug: 'lunette',               description: 'Parfum & Bijoux' },
  ];

  const allCats = await Promise.all(
    catDefs.map((data) => prisma.categorie.create({ data })),
  );

  const catBySlug = Object.fromEntries(allCats.map((c) => [c.slug, c]));

  console.log(`✔ ${allCats.length} catégories créées`);

  // ─── Produits de démonstration ─────────────────────────────────────────────
  const produit1 = await prisma.produit.create({
    data: {
      nom: 'Tee-shirt Premium',
      sku: 'TSH-001',
      description: 'Tee-shirt coton premium',
      categorieId: catBySlug['tee-shirt'].id,
      prixVente: new Prisma.Decimal('12500.00'),
      prixAchat: new Prisma.Decimal('8000.00'),
    },
  });

  const produit2 = await prisma.produit.create({
    data: {
      nom: 'Jogging Classic',
      sku: 'JOG-002',
      description: 'Jogging coupe slim',
      categorieId: catBySlug['jogging'].id,
      prixVente: new Prisma.Decimal('18000.00'),
      prixAchat: new Prisma.Decimal('11000.00'),
    },
  });

  const produit3 = await prisma.produit.create({
    data: {
      nom: 'Basket Runner',
      sku: 'BAS-003',
      description: 'Basket confortable pour la ville',
      categorieId: catBySlug['basket'].id,
      prixVente: new Prisma.Decimal('25000.00'),
      prixAchat: new Prisma.Decimal('15000.00'),
    },
  });

  const produit4 = await prisma.produit.create({
    data: {
      nom: 'Sac à dos Urban',
      sku: 'SAC-004',
      description: 'Sac à dos streetwear',
      categorieId: catBySlug['sac'].id,
      prixVente: new Prisma.Decimal('14000.00'),
      prixAchat: new Prisma.Decimal('9000.00'),
    },
  });

  const variantes = [] as Array<{ id: string }>;

  for (const payload of [
    { produitId: produit1.id, taille: 'M',  couleur: 'Noir',  stock: 25, seuil: 5 },
    { produitId: produit1.id, taille: 'L',  couleur: 'Blanc', stock: 18, seuil: 4 },
    { produitId: produit2.id, taille: 'M',  couleur: 'Marine', stock: 12, seuil: 3 },
    { produitId: produit3.id, taille: '42', couleur: 'Blanc', stock: 10, seuil: 3 },
    { produitId: produit3.id, taille: '43', couleur: 'Noir',  stock: 8,  seuil: 2 },
    { produitId: produit4.id, taille: 'Petit', couleur: 'Sac à dos', stock: 7, seuil: 2 },
  ]) {
    const v = await prisma.variante.create({
      data: {
        produitId: payload.produitId,
        taille: payload.taille,
        couleur: payload.couleur,
        quantiteStock: payload.stock,
        seuilAlerte: payload.seuil,
      },
    });
    variantes.push(v);
  }

  // ─── Entrée de stock ────────────────────────────────────────────────────────
  const entree = await prisma.entree.create({
    data: {
      reference: 'ENT-2026-001',
      fournisseur: 'Grossiste Abidjan',
      totalCout: new Prisma.Decimal('124000.00'),
      notes: 'Livraison initiale du mois',
      userId: admin.id,
      lignes: {
        create: [
          { varianteId: variantes[0].id, quantite: 20, prixUnitaire: new Prisma.Decimal('5000.00') },
          { varianteId: variantes[2].id, quantite: 10, prixUnitaire: new Prisma.Decimal('7000.00') },
          { varianteId: variantes[4].id, quantite: 8,  prixUnitaire: new Prisma.Decimal('9000.00') },
        ],
      },
    },
  });

  await prisma.mouvementStock.createMany({
    data: [
      { varianteId: variantes[0].id, type: 'ENTREE', quantite: 20, motif: 'Réception initiale', referenceEntree: entree.reference, userId: admin.id },
      { varianteId: variantes[2].id, type: 'ENTREE', quantite: 10, motif: 'Réception initiale', referenceEntree: entree.reference, userId: admin.id },
      { varianteId: variantes[4].id, type: 'ENTREE', quantite: 8,  motif: 'Réception initiale', referenceEntree: entree.reference, userId: admin.id },
    ],
  });

  await prisma.variante.update({ where: { id: variantes[0].id }, data: { quantiteStock: { increment: 20 } } });
  await prisma.variante.update({ where: { id: variantes[2].id }, data: { quantiteStock: { increment: 10 } } });
  await prisma.variante.update({ where: { id: variantes[4].id }, data: { quantiteStock: { increment: 8  } } });

  // ─── Session caisse ─────────────────────────────────────────────────────────
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
        create: [{ varianteId: variantes[0].id, quantite: 2, prixUnitaire: new Prisma.Decimal('12500.00') }],
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

  await prisma.variante.update({ where: { id: variantes[0].id }, data: { quantiteStock: { decrement: 2 } } });

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
  console.log(`- Utilisateurs : 2`);
  console.log(`- Catégories   : ${allCats.length}`);
  console.log(`- Produits     : 4`);
  console.log(`- Variantes    : ${variantes.length}`);
}

main()
  .catch((error) => {
    console.error('❌ Erreur lors du seed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
