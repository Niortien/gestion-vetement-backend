import { INestApplication, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    const maxAttempts = 5;
    const connectTimeoutMs = 8000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await Promise.race([
          this.$connect(),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error(`DB connect timeout after ${connectTimeoutMs}ms`)),
              connectTimeoutMs,
            ),
          ),
        ]);
        this.logger.log('Database connected');
        return;
      } catch (err) {
        const isLast = attempt === maxAttempts;
        this.logger.warn(
          `DB connect attempt ${attempt}/${maxAttempts} failed: ${(err as Error).message}`,
        );
        if (isLast) throw err;
        await new Promise((r) => setTimeout(r, attempt * 1000));
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  async enableShutdownHooks(app: INestApplication): Promise<void> {
    void app;
  }
}
