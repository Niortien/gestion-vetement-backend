import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.user.findMany({ select: { email: true, role: true, passwordHash: true } })
  .then(users => { console.log(JSON.stringify(users, null, 2)); })
  .finally(() => prisma.$disconnect());
