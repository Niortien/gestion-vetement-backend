import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import configuration from './config/configuration';
import { validationSchema } from './config/validation.schema';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProduitsModule } from './produits/produits.module';
import { StockModule } from './stock/stock.module';
import { EntreesModule } from './entrees/entrees.module';
import { SortiesModule } from './sorties/sorties.module';
import { CaisseModule } from './caisse/caisse.module';
import { RapportsModule } from './rapports/rapports.module';
import { BoutiquesModule } from './boutiques/boutiques.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    WinstonModule.forRoot({
      format: winston.format.json(),
      transports: [new winston.transports.Console()],
    }),
    CqrsModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProduitsModule,
    StockModule,
    EntreesModule,
    SortiesModule,
    CaisseModule,
    RapportsModule,
    BoutiquesModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class AppModule {}
