import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { rethrowPrismaWriteError } from '../../common/errors/prisma-write-error';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  findAllAdmin() {
    return this.prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async create(dto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({ data: dto });
    } catch (error: unknown) {
      rethrowPrismaWriteError(error, 'La categoría');
    }
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.assertExists(id);
    try {
      return await this.prisma.category.update({ where: { id }, data: dto });
    } catch (error: unknown) {
      rethrowPrismaWriteError(error, 'La categoría');
    }
  }

  async remove(id: string): Promise<void> {
    await this.assertExists(id);
    const productCount = await this.prisma.product.count({
      where: { categoryId: id, isActive: true },
    });

    if (productCount > 0) {
      throw new ConflictException(
        'No se puede desactivar una categoría con productos activos.',
      );
    }

    await this.prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private async assertExists(id: string): Promise<void> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException(`Categoría ${id} no encontrada.`);
    }
  }
}
