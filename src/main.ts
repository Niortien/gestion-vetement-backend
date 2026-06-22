import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { AppValidationPipe } from './common/pipes/validation.pipe';

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err?.message ?? err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION]', reason);
  process.exit(1);
});

async function bootstrap() {
  console.log(`[STARTUP] 1 - bootstrap start (PID ${process.pid})`);
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  console.log('[STARTUP] 2 - app created');
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.use(helmet());
  app.enableCors();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new AppValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('Stock & Caisse API')
    .setDescription('API REST de gestion de stock et de caisse')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document);

  app.enableShutdownHooks();
  const port = Number(process.env.PORT ?? 8013);
  console.log('[STARTUP] 3 - listening on port', port);
  await app.listen(port);
  console.log(`[STARTUP] 4 - app ready (PID ${process.pid})`);
}

bootstrap().catch((err) => {
  console.error('[STARTUP ERROR]', err?.message ?? err);
  process.exit(1);
});
