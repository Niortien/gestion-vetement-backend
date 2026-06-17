import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { DomainException } from '../exceptions/domain.exception';

const PRISMA_FRIENDLY: Record<string, string> = {
  P2002: 'Cette valeur existe déjà.',
  P2003: 'Référence invalide — reconnectez-vous et réessayez.',
  P2025: 'Enregistrement introuvable.',
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof DomainException) {
      response.status(exception.statusCode).json({
        error: {
          code: exception.code,
          message: exception.message,
          details: exception.details ?? null,
        },
        path: request.url,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const message = PRISMA_FRIENDLY[exception.code] ?? `Erreur base de données (${exception.code})`;
      response.status(HttpStatus.BAD_REQUEST).json({
        error: { code: exception.code, message },
        path: request.url,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      response.status(HttpStatus.BAD_REQUEST).json({
        error: { code: 'PRISMA_VALIDATION', message: 'Données invalides envoyées à la base de données.' },
        path: request.url,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json({
        error: exception.getResponse(),
        path: request.url,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Une erreur inattendue est survenue',
      },
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
