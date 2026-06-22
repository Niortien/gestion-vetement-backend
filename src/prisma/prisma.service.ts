import { INestApplication, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    const maxAttempts = 5;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.$connect();
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

  async enableShutdownHooks(app: INestApplication): Promise<void> {
    void app;
  }
}
