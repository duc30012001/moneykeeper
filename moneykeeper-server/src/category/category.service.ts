import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { Category, Prisma, TransactionType } from '@prisma/client';

export interface CategoryTree extends Category {
  children: CategoryTree[];
}

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string): Promise<CategoryTree[]> {
    const categories = await this.prisma.category.findMany({
      where: {
        OR: [{ user_id: userId }, { is_default: true, user_id: null }],
      },
      include: { children: true },
      orderBy: { name: 'asc' },
    });

    return this.buildTree(categories);
  }

  async findByType(
    userId: string,
    type: TransactionType,
  ): Promise<CategoryTree[]> {
    const categories = await this.prisma.category.findMany({
      where: {
        type,
        OR: [{ user_id: userId }, { is_default: true, user_id: null }],
      },
      include: { children: true },
      orderBy: { name: 'asc' },
    });

    return this.buildTree(categories);
  }

  async findOne(id: string, userId: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        OR: [{ user_id: userId }, { is_default: true, user_id: null }],
      },
      include: { children: true },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async create(dto: CreateCategoryDto, userId: string) {
    try {
      return await this.prisma.category.create({
        data: {
          name: dto.name,
          type: dto.type,
          icon: dto.icon,
          parent_id: dto.parent_id,
          user_id: userId,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Category name already exists for this type',
        );
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateCategoryDto, userId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, user_id: userId },
    });
    if (!category)
      throw new NotFoundException('Category not found or not editable');

    try {
      return await this.prisma.category.update({
        where: { id },
        data: {
          name: dto.name,
          icon: dto.icon,
          parent_id: dto.parent_id,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Category name already exists for this type',
        );
      }
      throw error;
    }
  }

  async remove(id: string, userId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, user_id: userId },
    });
    if (!category)
      throw new NotFoundException('Category not found or not deletable');

    return this.prisma.category.delete({ where: { id } });
  }

  private buildTree(
    categories: (Category & { children: Category[] })[],
  ): CategoryTree[] {
    const map = new Map<string, CategoryTree>();
    const roots: CategoryTree[] = [];

    for (const cat of categories) {
      map.set(cat.id, { ...cat, children: [] });
    }

    for (const cat of categories) {
      const node = map.get(cat.id)!;
      if (cat.parent_id && map.has(cat.parent_id)) {
        map.get(cat.parent_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}
