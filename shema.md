CREATE SCHEMA "public";
CREATE TYPE "UserRole" AS ENUM('ADMIN', 'VENDEUR');
CREATE TYPE "TypeMouvementStock" AS ENUM('ENTREE', 'SORTIE', 'AJUSTEMENT', 'RETOUR');
CREATE TYPE "TypeSortie" AS ENUM('VENTE', 'PERTE', 'DON', 'RETOUR_FOURNISSEUR');
CREATE TYPE "StatutSessionCaisse" AS ENUM('OUVERTE', 'FERMEE');
CREATE TYPE "ModePaiement" AS ENUM('CASH', 'WAVE', 'ORANGE_MONEY', 'CARTE', 'MTN_MONEY');
CREATE TABLE "Boutique" (
	"id" text PRIMARY KEY,
	"nom" text NOT NULL,
	"adresse" text,
	"ville" text,
	"whatsapp" text,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp NOT NULL
);
CREATE TABLE "Categorie" (
	"id" text PRIMARY KEY,
	"nom" text NOT NULL,
	"slug" text NOT NULL,
	"description" text
);
CREATE TABLE "Entree" (
	"id" text PRIMARY KEY,
	"reference" text NOT NULL,
	"fournisseur" text NOT NULL,
	"totalCout" numeric(10, 2) NOT NULL,
	"notes" text,
	"userId" text NOT NULL,
	"boutiqueId" text,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE "LigneEntree" (
	"id" text PRIMARY KEY,
	"entreeId" text NOT NULL,
	"varianteId" text NOT NULL,
	"quantite" integer NOT NULL,
	"prixUnitaire" numeric(10, 2) NOT NULL
);
CREATE TABLE "LigneSortie" (
	"id" text PRIMARY KEY,
	"sortieId" text NOT NULL,
	"varianteId" text NOT NULL,
	"quantite" integer NOT NULL,
	"prixUnitaire" numeric(10, 2) NOT NULL
);
CREATE TABLE "MouvementStock" (
	"id" text PRIMARY KEY,
	"varianteId" text NOT NULL,
	"type" TypeMouvementStock NOT NULL,
	"quantite" integer NOT NULL,
	"motif" text,
	"referenceEntree" text,
	"referenceSortie" text,
	"userId" text NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE "Produit" (
	"id" text PRIMARY KEY,
	"nom" text NOT NULL,
	"sku" text NOT NULL,
	"description" text,
	"categorieId" text NOT NULL,
	"prixVente" numeric(10, 2) NOT NULL,
	"prixAchat" numeric(10, 2) NOT NULL,
	"imageUrl" text,
	"isActif" boolean DEFAULT true NOT NULL,
	"enPromo" boolean DEFAULT false NOT NULL,
	"prixPromo" numeric(10, 2),
	"dateDebutPromo" timestamp,
	"dateFinPromo" timestamp,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp NOT NULL
);
CREATE TABLE "ProduitImage" (
	"id" text PRIMARY KEY,
	"produitId" text NOT NULL,
	"url" text NOT NULL,
	"ordre" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE "Session" (
	"id" text PRIMARY KEY,
	"userId" text NOT NULL,
	"boutiqueId" text,
	"dateOuverture" timestamp NOT NULL,
	"dateFermeture" timestamp,
	"montantOuverture" numeric(10, 2) NOT NULL,
	"montantFermeture" numeric(10, 2),
	"statut" StatutSessionCaisse NOT NULL
);
CREATE TABLE "Sortie" (
	"id" text PRIMARY KEY,
	"reference" text NOT NULL,
	"type" TypeSortie NOT NULL,
	"totalAvantRemise" numeric(10, 2),
	"remiseMontant" numeric(10, 2),
	"totalMontant" numeric(10, 2) NOT NULL,
	"notes" text,
	"userId" text NOT NULL,
	"boutiqueId" text,
	"transactionId" text,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE "Transaction" (
	"id" text PRIMARY KEY,
	"sessionId" text NOT NULL,
	"sortieId" text,
	"montant" numeric(10, 2) NOT NULL,
	"modePaiement" ModePaiement NOT NULL,
	"reference" text,
	"notes" text,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE "User" (
	"id" text PRIMARY KEY,
	"email" text NOT NULL,
	"passwordHash" text NOT NULL,
	"role" UserRole DEFAULT 'VENDEUR' NOT NULL,
	"boutiqueId" text,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp NOT NULL
);
CREATE TABLE "Variante" (
	"id" text PRIMARY KEY,
	"produitId" text NOT NULL,
	"boutiqueId" text,
	"taille" text NOT NULL,
	"couleur" text NOT NULL,
	"quantiteStock" integer NOT NULL,
	"seuilAlerte" integer NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp NOT NULL
);
CREATE UNIQUE INDEX "Boutique_pkey" ON "Boutique" ("id");
CREATE UNIQUE INDEX "Categorie_pkey" ON "Categorie" ("id");
CREATE UNIQUE INDEX "Categorie_slug_key" ON "Categorie" ("slug");
CREATE UNIQUE INDEX "Entree_pkey" ON "Entree" ("id");
CREATE UNIQUE INDEX "Entree_reference_key" ON "Entree" ("reference");
CREATE UNIQUE INDEX "LigneEntree_pkey" ON "LigneEntree" ("id");
CREATE UNIQUE INDEX "LigneSortie_pkey" ON "LigneSortie" ("id");
CREATE UNIQUE INDEX "MouvementStock_pkey" ON "MouvementStock" ("id");
CREATE UNIQUE INDEX "Produit_pkey" ON "Produit" ("id");
CREATE UNIQUE INDEX "Produit_sku_key" ON "Produit" ("sku");
CREATE UNIQUE INDEX "ProduitImage_pkey" ON "ProduitImage" ("id");
CREATE UNIQUE INDEX "Session_pkey" ON "Session" ("id");
CREATE UNIQUE INDEX "Sortie_pkey" ON "Sortie" ("id");
CREATE UNIQUE INDEX "Sortie_reference_key" ON "Sortie" ("reference");
CREATE UNIQUE INDEX "Transaction_pkey" ON "Transaction" ("id");
CREATE UNIQUE INDEX "Transaction_sortieId_key" ON "Transaction" ("sortieId");
CREATE UNIQUE INDEX "User_email_key" ON "User" ("email");
CREATE UNIQUE INDEX "User_pkey" ON "User" ("id");
CREATE UNIQUE INDEX "Variante_pkey" ON "Variante" ("id");
CREATE UNIQUE INDEX "Variante_produitId_taille_couleur_boutiqueId_key" ON "Variante" ("produitId","taille","couleur","boutiqueId");
ALTER TABLE "Entree" ADD CONSTRAINT "Entree_boutiqueId_fkey" FOREIGN KEY ("boutiqueId") REFERENCES "Boutique"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Entree" ADD CONSTRAINT "Entree_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LigneEntree" ADD CONSTRAINT "LigneEntree_entreeId_fkey" FOREIGN KEY ("entreeId") REFERENCES "Entree"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LigneEntree" ADD CONSTRAINT "LigneEntree_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "Variante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LigneSortie" ADD CONSTRAINT "LigneSortie_sortieId_fkey" FOREIGN KEY ("sortieId") REFERENCES "Sortie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LigneSortie" ADD CONSTRAINT "LigneSortie_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "Variante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MouvementStock" ADD CONSTRAINT "MouvementStock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MouvementStock" ADD CONSTRAINT "MouvementStock_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "Variante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Produit" ADD CONSTRAINT "Produit_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "Categorie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProduitImage" ADD CONSTRAINT "ProduitImage_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_boutiqueId_fkey" FOREIGN KEY ("boutiqueId") REFERENCES "Boutique"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Sortie" ADD CONSTRAINT "Sortie_boutiqueId_fkey" FOREIGN KEY ("boutiqueId") REFERENCES "Boutique"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Sortie" ADD CONSTRAINT "Sortie_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_boutiqueId_fkey" FOREIGN KEY ("boutiqueId") REFERENCES "Boutique"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Variante" ADD CONSTRAINT "Variante_boutiqueId_fkey" FOREIGN KEY ("boutiqueId") REFERENCES "Boutique"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Variante" ADD CONSTRAINT "Variante_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;