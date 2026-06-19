import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  email: string;
  role: 'ADMIN' | 'VENDEUR';
  boutiqueId: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('jwtSecret', {
        infer: true,
      }),
    });
  }

  validate(payload: JwtPayload): {
    id: string;
    email: string;
    role: 'ADMIN' | 'VENDEUR';
    boutiqueId: string | null;
  } {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      boutiqueId: payload.boutiqueId ?? null,
    };
  }
}
