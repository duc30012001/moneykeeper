import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma';
import { CreateWalletDto, UpdateWalletDto } from './dto';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.wallet.findMany({
      where: { user_id: userId },
      orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
    });
  }

  async findOne(id: string, userId: string) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { id, user_id: userId },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }

  async create(dto: CreateWalletDto, userId: string) {
    const wallet = await this.prisma.wallet.create({
      data: {
        name: dto.name,
        initial_balance: dto.initial_balance
          ? new Prisma.Decimal(dto.initial_balance)
          : new Prisma.Decimal(0),
        balance: dto.initial_balance
          ? new Prisma.Decimal(dto.initial_balance)
          : new Prisma.Decimal(0),
        user_id: userId,
      },
    });
    return wallet;
  }

  async update(id: string, dto: UpdateWalletDto, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.wallet.update({
      where: { id },
      data: {
        name: dto.name,
        initial_balance:
          dto.initial_balance !== undefined
            ? new Prisma.Decimal(dto.initial_balance)
            : undefined,
        sort_order: dto.sort_order,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.wallet.delete({ where: { id } });
  }

  async reorder(items: { id: string; sort_order: number }[], userId: string) {
    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.wallet.updateMany({
          where: { id: item.id, user_id: userId },
          data: { sort_order: item.sort_order },
        }),
      ),
    );
    return { success: true };
  }
}
