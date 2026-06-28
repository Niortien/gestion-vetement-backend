import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '@prisma/client';
import {
  ConflictDomainException,
  ValidationDomainException,
} from '../common/exceptions/domain.exception';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      return user;
    }
    return null;
  }

  async login(
    email: string,
    password: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: { id: string; email: string; role: 'ADMIN' | 'VENDEUR'; boutiqueId: string | null };
  }> {
    const user = await this.validateUser(email, password);

    if (!user) {
      throw new ValidationDomainException(
        'Identifiants invalides',
        'AUTH_INVALID_CREDENTIALS',
      );
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      boutiqueId: user.boutiqueId ?? null,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('jwtSecret', {
          infer: true,
        }),
        expiresIn: this.configService.getOrThrow<string>('jwtTtl', { infer: true }),
      }),
      refreshToken: await this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('jwtRefreshSecret', {
          infer: true,
        }),
        expiresIn: this.configService.getOrThrow<string>('jwtRefreshTtl', { infer: true }),
      }),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        boutiqueId: user.boutiqueId ?? null,
      },
    };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
        role: 'ADMIN' | 'VENDEUR';
        boutiqueId: string | null;
      }>(refreshToken, {
        secret: this.configService.getOrThrow<string>('jwtRefreshSecret', {
          infer: true,
        }),
      });

      const accessToken = await this.jwtService.signAsync(
        {
          sub: payload.sub,
          email: payload.email,
          role: payload.role,
          boutiqueId: payload.boutiqueId ?? null,
        },
        {
          secret: this.configService.getOrThrow<string>('jwtSecret', {
            infer: true,
          }),
          expiresIn: this.configService.getOrThrow<string>('jwtTtl', { infer: true }),
        },
      );

      return { accessToken };
    } catch {
      throw new ConflictDomainException(
        'Refresh token invalide',
        'AUTH_INVALID_REFRESH',
      );
    }
  }

  async logout(): Promise<{ success: boolean }> {
    return { success: true };
  }
}
