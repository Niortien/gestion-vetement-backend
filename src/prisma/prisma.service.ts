import { INestApplication, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const url = process.env.DATABASE_URL ?? '';
    const sep = url.includes('?') ? '&' : '?';
    super({ datasources: { db: { url: `${url}${sep}connection_limit=1` } } });
  }

  async onModuleInit(): Promise<void> {
    // Lazy connection — Prisma connects on first query.
    // Avoids Tokio timer panics when multiple containers start simultaneously.
    this.logger.log('PrismaService ready (lazy connection)');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  async enableShutdownHooks(app: INestApplication): Promise<void> {
    void app;
  }
}
