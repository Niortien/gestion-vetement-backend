import { INestApplication, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    await this.$connect();
    await this.seedIfEmpty();
  }

  async enableShutdownHooks(app: INestApplication): Promise<void> {
    void app;
  }

  private async seedIfEmpty(): Promise<void> {
    const userCount = await this.user.count();
    if (userCount > 0) return;

    this.logger.log('Base vide — initialisation des données de démarrage...');

    const hash = await bcrypt.hash('StrongPass123!', 12);

    await this.user.upsert({
      where: { email: 'admin@shop.com' },
      update: {},
      create: { email: 'admin@shop.com', passwordHash: hash, role: 'ADMIN' },
    });
    await this.user.upsert({
      where: { email: 'vendeur@shop.com' },
      update: {},
      create: { email: 'vendeur@shop.com', passwordHash: hash, role: 'VENDEUR' },
    });

    const cats = [
      { nom: 'Tee-shirt', slug: 'tee-shirt', description: 'Hauts' },
      { nom: 'Polo', slug: 'polo', description: 'Hauts' },
      { nom: 'Polo corp', slug: 'polo-corp', description: 'Hauts' },
      { nom: 'Polo sans col', slug: 'polo-sans-col', description: 'Hauts' },
      { nom: 'Polo cardigan', slug: 'polo-cardigan', description: 'Hauts' },
      { nom: 'Déambré', slug: 'deambre', description: 'Hauts' },
      { nom: 'Débardeur', slug: 'debardeur', description: 'Hauts' },
      { nom: 'Chemise simple', slug: 'chemise-simple', description: 'Chemises & Vestes' },
      { nom: 'Chemise croppée', slug: 'chemise-crope', description: 'Chemises & Vestes' },
      { nom: 'Djaket', slug: 'djaket', description: 'Chemises & Vestes' },
      { nom: 'Doudoune', slug: 'doudoune', description: 'Chemises & Vestes' },
      { nom: 'Complet-culotte', slug: 'complet-culotte', description: 'Tenues' },
      { nom: 'Complet-pantalon', slug: 'complet-pantalon', description: 'Tenues' },
      { nom: 'Complet-pull', slug: 'complet-pull', description: 'Tenues' },
      { nom: 'Complet sous-vêtement', slug: 'complet-sous-vetement', description: 'Tenues' },
      { nom: 'Pull simple', slug: 'pull-simple', description: 'Pulls & Maillots' },
      { nom: 'Pull cardigan', slug: 'pull-cardigan', description: 'Pulls & Maillots' },
      { nom: 'Maillot de foot', slug: 'maillot-foot', description: 'Pulls & Maillots' },
      { nom: 'Maillot de basket', slug: 'maillot-basket', description: 'Pulls & Maillots' },
      { nom: 'Pantalon tissu', slug: 'pantalon-tissu', description: 'Bas' },
      { nom: 'Pantalon docker', slug: 'pantalon-docker', description: 'Bas' },
      { nom: 'Jogging', slug: 'jogging', description: 'Bas' },
      { nom: 'Basket', slug: 'basket', description: 'Chaussures' },
      { nom: 'Barbouche', slug: 'barbouche', description: 'Chaussures' },
      { nom: 'Cross', slug: 'cross', description: 'Chaussures' },
      { nom: 'Soulier', slug: 'soulier', description: 'Chaussures' },
      { nom: 'Sandale', slug: 'sandale', description: 'Chaussures' },
      { nom: 'Claquette', slug: 'claquette', description: 'Chaussures' },
      { nom: 'Sac', slug: 'sac', description: 'Sacs & Divers' },
      { nom: 'Chaussettes', slug: 'chaussettes', description: 'Sacs & Divers' },
      { nom: 'Chocoto', slug: 'chocoto', description: 'Sacs & Divers' },
      { nom: 'Parfum', slug: 'parfum', description: 'Parfum & Bijoux' },
      { nom: 'Montre', slug: 'montre', description: 'Parfum & Bijoux' },
      { nom: 'Lunette', slug: 'lunette', description: 'Parfum & Bijoux' },
    ];

    for (const cat of cats) {
      await this.categorie.upsert({
        where: { slug: cat.slug },
        update: {},
        create: cat,
      });
    }

    this.logger.log('✅ Seed initial terminé — admin@shop.com / StrongPass123!');
  }
}
