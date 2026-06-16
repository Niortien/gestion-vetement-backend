-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'VENDEUR');

-- CreateEnum
CREATE TYPE "TailleVariante" AS ENUM ('XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL');

-- CreateEnum
CREATE TYPE "TypeMouvementStock" AS ENUM ('ENTREE', 'SORTIE', 'AJUSTEMENT', 'RETOUR');

-- CreateEnum
CREATE TYPE "TypeSortie" AS ENUM ('VENTE', 'PERTE', 'DON', 'RETOUR_FOURNISSEUR');

-- CreateEnum
CREATE TYPE "StatutSessionCaisse" AS ENUM ('OUVERTE', 'FERMEE');

-- CreateEnum
CREATE TYPE "ModePaiement" AS ENUM ('CASH', 'WAVE', 'ORANGE_MONEY', 'CARTE', 'MTN_MONEY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'VENDEUR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categorie" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Categorie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Produit" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "description" TEXT,
    "categorieId" TEXT NOT NULL,
    "prixVente" DECIMAL(10,2) NOT NULL,
    "prixAchat" DECIMAL(10,2) NOT NULL,
    "imageUrl" TEXT,
    "isActif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Produit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProduitImage" (
    "id" TEXT NOT NULL,
    "produitId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProduitImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Variante" (
    "id" TEXT NOT NULL,
    "produitId" TEXT NOT NULL,
    "taille" "TailleVariante" NOT NULL,
    "couleur" TEXT NOT NULL,
    "quantiteStock" INTEGER NOT NULL,
    "seuilAlerte" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Variante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MouvementStock" (
    "id" TEXT NOT NULL,
    "varianteId" TEXT NOT NULL,
    "type" "TypeMouvementStock" NOT NULL,
    "quantite" INTEGER NOT NULL,
    "motif" TEXT,
    "referenceEntree" TEXT,
    "referenceSortie" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MouvementStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entree" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "fournisseur" TEXT NOT NULL,
    "totalCout" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Entree_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneEntree" (
    "id" TEXT NOT NULL,
    "entreeId" TEXT NOT NULL,
    "varianteId" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prixUnitaire" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "LigneEntree_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sortie" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "type" "TypeSortie" NOT NULL,
    "totalMontant" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "userId" TEXT NOT NULL,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sortie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneSortie" (
    "id" TEXT NOT NULL,
    "sortieId" TEXT NOT NULL,
    "varianteId" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prixUnitaire" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "LigneSortie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateOuverture" TIMESTAMP(3) NOT NULL,
    "dateFermeture" TIMESTAMP(3),
    "montantOuverture" DECIMAL(10,2) NOT NULL,
    "montantFermeture" DECIMAL(10,2),
    "statut" "StatutSessionCaisse" NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sortieId" TEXT,
    "montant" DECIMAL(10,2) NOT NULL,
    "modePaiement" "ModePaiement" NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Categorie_slug_key" ON "Categorie"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Produit_sku_key" ON "Produit"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Variante_produitId_taille_couleur_key" ON "Variante"("produitId", "taille", "couleur");

-- CreateIndex
CREATE UNIQUE INDEX "Entree_reference_key" ON "Entree"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Sortie_reference_key" ON "Sortie"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_sortieId_key" ON "Transaction"("sortieId");

-- AddForeignKey
ALTER TABLE "Produit" ADD CONSTRAINT "Produit_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "Categorie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProduitImage" ADD CONSTRAINT "ProduitImage_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Variante" ADD CONSTRAINT "Variante_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementStock" ADD CONSTRAINT "MouvementStock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementStock" ADD CONSTRAINT "MouvementStock_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "Variante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entree" ADD CONSTRAINT "Entree_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneEntree" ADD CONSTRAINT "LigneEntree_entreeId_fkey" FOREIGN KEY ("entreeId") REFERENCES "Entree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneEntree" ADD CONSTRAINT "LigneEntree_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "Variante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sortie" ADD CONSTRAINT "Sortie_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneSortie" ADD CONSTRAINT "LigneSortie_sortieId_fkey" FOREIGN KEY ("sortieId") REFERENCES "Sortie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneSortie" ADD CONSTRAINT "LigneSortie_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "Variante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
