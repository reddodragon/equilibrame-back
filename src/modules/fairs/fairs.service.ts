import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFairDto } from './dto/create-fair.dto';
import { UpdateFairDto } from './dto/update-fair.dto';

@Injectable()
export class FairsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.fair.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const fair = await this.prisma.fair.findUnique({
      where: { id },
    });
    if (!fair) {
      throw new NotFoundException(`Feria con ID ${id} no encontrada.`);
    }
    return fair;
  }

  async create(dto: CreateFairDto) {
    return this.prisma.fair.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateFairDto) {
    await this.findOne(id);
    return this.prisma.fair.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.fair.delete({
      where: { id },
    });
    return { success: true };
  }
}
