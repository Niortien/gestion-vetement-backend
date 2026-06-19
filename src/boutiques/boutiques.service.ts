import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBoutiqueDto } from './dto/create-boutique.dto';
import { NotFoundDomainException } from '../common/exceptions/domain.exception';

@Injectable()
export class BoutiquesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.boutique.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async findById(id: string) {
    const b = await this.prisma.boutique.findUnique({ where: { id } });
    if (!b) throw new NotFoundDomainException('Boutique introuvable', 'BOUTIQUE_NOT_FOUND');
    return b;
  }

  create(dto: CreateBoutiqueDto) {
    return this.prisma.boutique.create({ data: dto });
  }

  async update(id: string, dto: Partial<CreateBoutiqueDto>) {
    await this.findById(id);
    return this.prisma.boutique.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.boutique.delete({ where: { id } });
  }
}
