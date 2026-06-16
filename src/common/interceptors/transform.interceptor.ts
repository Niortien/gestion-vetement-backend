import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

interface ApiEnvelope<T> {
  data: T;
  meta: Record<string, unknown> | null;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiEnvelope<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiEnvelope<T>> {
    void context;

    return next.handle().pipe(
      map((data: T) => {
        const maybeWithMeta = data as unknown as {
          data?: T;
          meta?: Record<string, unknown>;
        };

        if (
          typeof maybeWithMeta === 'object' &&
          maybeWithMeta !== null &&
          'data' in maybeWithMeta
        ) {
          return {
            data: maybeWithMeta.data as T,
            meta: maybeWithMeta.meta ?? null,
            timestamp: new Date().toISOString(),
          };
        }

        return {
          data,
          meta: null,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
