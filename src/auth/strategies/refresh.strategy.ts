import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface RefreshJwtPayload {
  sub: string;
  email: string;
  role: 'ADMIN' | 'VENDEUR';
}

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'refresh-jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('jwtRefreshSecret', {
        infer: true,
      }),
    });
  }

  validate(payload: RefreshJwtPayload): RefreshJwtPayload {
    return payload;
  }
}
