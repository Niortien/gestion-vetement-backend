import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
  ConflictDomainException,
  NotFoundDomainException,
} from '../common/exceptions/domain.exception';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      include: { boutique: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existing = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existing) {
      throw new ConflictDomainException(
        'Un utilisateur avec cet email existe deja',
        'USER_EMAIL_EXISTS',
      );
    }

    return this.prisma.user.create({
      data: {
        email: createUserDto.email,
        passwordHash: await bcrypt.hash(createUserDto.password, 12),
        role: createUserDto.role ?? UserRole.VENDEUR,
        boutiqueId: createUserDto.boutiqueId ?? null,
      },
    });
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    await this.findById(id);
    const data: Record<string, unknown> = {};
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.boutiqueId !== undefined) data.boutiqueId = dto.boutiqueId;
    if (dto.password !== undefined) data.passwordHash = await bcrypt.hash(dto.password, 12);
    return this.prisma.user.update({ where: { id }, data });
  }

  async remove(id: string): Promise<User> {
    await this.findById(id);
    return this.prisma.user.delete({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundDomainException(
        'Utilisateur introuvable',
        'USER_NOT_FOUND',
        { userId: id },
      );
    }
    return user;
  }
}
