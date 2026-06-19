import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // Tente d'authentifier optionnellement : si un token valide est présent
      // il sera résolu dans request.user, sinon on laisse passer sans user.
      try {
        await super.canActivate(context);
      } catch {
        // pas de token ou token invalide → route publique, on ignore
      }
      return true;
    }

    return super.canActivate(context) as Promise<boolean>;
  }
}
