import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from './prisma.service';

const CATEGORIES = [
  { nom: 'Tee-shirt',              slug: 'tee-shirt',              description: 'Hauts' },
  { nom: 'Polo',                   slug: 'polo',                   description: 'Hauts' },
  { nom: 'Polo corp',              slug: 'polo-corp',              description: 'Hauts' },
  { nom: 'Polo sans col',          slug: 'polo-sans-col',          description: 'Hauts' },
  { nom: 'Polo cardigan',          slug: 'polo-cardigan',          description: 'Hauts' },
  { nom: 'Déambré',                slug: 'deambre',                description: 'Hauts' },
  { nom: 'Débardeur',              slug: 'debardeur',              description: 'Hauts' },
  { nom: 'Chemise simple',         slug: 'chemise-simple',         description: 'Chemises & Vestes' },
  { nom: 'Chemise croppée',        slug: 'chemise-crope',          description: 'Chemises & Vestes' },
  { nom: 'Djaket',                 slug: 'djaket',                 description: 'Chemises & Vestes' },
  { nom: 'Doudoune',               slug: 'doudoune',               description: 'Chemises & Vestes' },
  { nom: 'Complet-culotte',        slug: 'complet-culotte',        description: 'Tenues' },
  { nom: 'Complet-pantalon',       slug: 'complet-pantalon',       description: 'Tenues' },
  { nom: 'Complet-pull',           slug: 'complet-pull',           description: 'Tenues' },
  { nom: 'Complet sous-vêtement',  slug: 'complet-sous-vetement',  description: 'Tenues' },
  { nom: 'Pull simple',            slug: 'pull-simple',            description: 'Pulls & Maillots' },
  { nom: 'Pull cardigan',          slug: 'pull-cardigan',          description: 'Pulls & Maillots' },
  { nom: 'Maillot de foot',        slug: 'maillot-foot',           description: 'Pulls & Maillots' },
  { nom: 'Maillot de basket',      slug: 'maillot-basket',         description: 'Pulls & Maillots' },
  { nom: 'Pantalon tissu',         slug: 'pantalon-tissu',         description: 'Bas' },
  { nom: 'Pantalon docker',        slug: 'pantalon-docker',        description: 'Bas' },
  { nom: 'Jogging',                slug: 'jogging',                description: 'Bas' },
  { nom: 'Jean Simple',            slug: 'jean-simple',            description: 'Bas' },
  { nom: 'Cargo',                  slug: 'cargo',                  description: 'Bas' },
  { nom: 'Culotte Simple',         slug: 'culotte-simple',         description: 'Culotte' },
  { nom: 'Culotte Away',           slug: 'culotte-away',           description: 'Culotte' },
  { nom: 'Culotte Jean',           slug: 'culotte-jean',           description: 'Culotte' },
  { nom: 'Pantacourt Asaké',       slug: 'pantacourt-asake',       description: 'Culotte' },
  { nom: 'Basket',                 slug: 'basket',                 description: 'Chaussures' },
  { nom: 'Barbouche',              slug: 'barbouche',              description: 'Chaussures' },
  { nom: 'Cross',                  slug: 'cross',                  description: 'Chaussures' },
  { nom: 'Soulier',                slug: 'soulier',                description: 'Chaussures' },
  { nom: 'Sandale',                slug: 'sandale',                description: 'Chaussures' },
  { nom: 'Claquette',              slug: 'claquette',              description: 'Chaussures' },
  { nom: 'Sac',                    slug: 'sac',                    description: 'Sacs & Divers' },
  { nom: 'Chaussettes',            slug: 'chaussettes',            description: 'Sacs & Divers' },
  { nom: 'Chocoto',                slug: 'chocoto',                description: 'Sacs & Divers' },
  { nom: 'Parfum',                 slug: 'parfum',                 description: 'Parfum & Bijoux' },
  { nom: 'Montre',                 slug: 'montre',                 description: 'Parfum & Bijoux' },
  { nom: 'Lunette',                slug: 'lunette',                description: 'Parfum & Bijoux' },
];

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      for (const cat of CATEGORIES) {
        await this.prisma.categorie.upsert({
          where: { slug: cat.slug },
          update: { nom: cat.nom, description: cat.description },
          create: cat,
        });
      }
      const total = await this.prisma.categorie.count();
      this.logger.log(`Categories synced — ${total} in database`);
    } catch (err: any) {
      this.logger.error('Category seed failed', err?.message);
    }
  }
}
