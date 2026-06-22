import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('StrongPass123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@shop.com' },
    update: {},
    create: { email: 'admin@shop.com', passwordHash, role: 'ADMIN' },
  });

  const vendeur = await prisma.user.upsert({
    where: { email: 'vendeur@shop.com' },
    update: {},
    create: { email: 'vendeur@shop.com', passwordHash, role: 'VENDEUR' },
  });

  console.log('✅ Utilisateurs initialisés');
  console.log(`  admin   : ${admin.email}`);
  console.log(`  vendeur : ${vendeur.email}`);
}

main()
  .catch((err) => {
    console.error('❌ seed-admin error', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
