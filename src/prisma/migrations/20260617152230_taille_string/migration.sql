-- AlterTable: cast enum to text without data loss
ALTER TABLE "Variante" ALTER COLUMN "taille" TYPE TEXT USING "taille"::text;

-- DropEnum
DROP TYPE "TailleVariante";
