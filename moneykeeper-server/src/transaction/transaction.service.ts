import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma';
import {
  CreateTransactionDto,
  TransactionQueryDto,
  UpdateTransactionDto,
} from './dto';

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, query: TransactionQueryDto) {
    const where: Prisma.TransactionWhereInput = { user_id: userId };

    if (query.type) where.type = query.type;
    if (query.wallet_id) {
      where.OR = [
        { wallet_id: query.wallet_id },
        { to_wallet_id: query.wallet_id },
      ];
    }
    if (query.category_id) where.category_id = query.category_id;
    if (query.from_date || query.to_date) {
      where.date = {};
      if (query.from_date) where.date.gte = new Date(query.from_date);
      if (query.to_date) where.date.lte = new Date(query.to_date);
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        include: {
          wallet: { select: { id: true, name: true } },
          to_wallet: { select: { id: true, name: true } },
          category: { select: { id: true, name: true, icon: true } },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, userId: string) {
    const tx = await this.prisma.transaction.findFirst({
      where: { id, user_id: userId },
      include: {
        wallet: { select: { id: true, name: true } },
        to_wallet: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, icon: true } },
      },
    });
    if (!tx) throw new NotFoundException('Transaction not found');
    return tx;
  }

  async create(dto: CreateTransactionDto, userId: string) {
    const amount = new Prisma.Decimal(dto.amount);

    this.validateTransfer(dto.type, dto.wallet_id, dto.to_wallet_id);
    await this.verifyOwnership(
      userId,
      dto.wallet_id,
      dto.to_wallet_id,
      dto.category_id,
    );

    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          amount,
          type: dto.type,
          note: dto.note,
          date: new Date(dto.date),
          wallet_id: dto.wallet_id,
          to_wallet_id: dto.to_wallet_id,
          category_id: dto.category_id,
          user_id: userId,
        },
      });

      await this.adjustBalances(
        tx,
        dto.type,
        amount,
        dto.wallet_id,
        dto.to_wallet_id,
      );

      return transaction;
    });
  }

  async update(id: string, dto: UpdateTransactionDto, userId: string) {
    const existing = await this.findOne(id, userId);

    const newType = dto.type ?? existing.type;
    const newWalletId = dto.wallet_id ?? existing.wallet_id;
    const newToWalletId =
      dto.to_wallet_id !== undefined ? dto.to_wallet_id : existing.to_wallet_id;

    this.validateTransfer(newType, newWalletId, newToWalletId);
    await this.verifyOwnership(
      userId,
      dto.wallet_id,
      dto.to_wallet_id,
      dto.category_id,
    );

    return this.prisma.$transaction(async (tx) => {
      // Reverse old balance adjustments
      await this.reverseBalances(
        tx,
        existing.type,
        existing.amount,
        existing.wallet_id,
        existing.to_wallet_id,
      );

      const newAmount = dto.amount
        ? new Prisma.Decimal(dto.amount)
        : existing.amount;

      const updated = await tx.transaction.update({
        where: { id },
        data: {
          amount: newAmount,
          type: newType,
          note: dto.note,
          date: dto.date ? new Date(dto.date) : undefined,
          wallet_id: newWalletId,
          to_wallet_id: newToWalletId,
          category_id: dto.category_id,
        },
      });

      // Apply new balance adjustments
      await this.adjustBalances(
        tx,
        newType,
        newAmount,
        newWalletId,
        newToWalletId,
      );

      return updated;
    });
  }

  async remove(id: string, userId: string) {
    const existing = await this.findOne(id, userId);

    return this.prisma.$transaction(async (tx) => {
      await this.reverseBalances(
        tx,
        existing.type,
        existing.amount,
        existing.wallet_id,
        existing.to_wallet_id,
      );

      return tx.transaction.delete({ where: { id } });
    });
  }

  private validateTransfer(
    type: TransactionType,
    walletId: string,
    toWalletId?: string | null,
  ) {
    if (type === TransactionType.transfer && !toWalletId) {
      throw new BadRequestException(
        'to_wallet_id is required for transfer type',
      );
    }
    if (type === TransactionType.transfer && walletId === toWalletId) {
      throw new BadRequestException('Cannot transfer to the same wallet');
    }
  }

  private async verifyOwnership(
    userId: string,
    walletId?: string,
    toWalletId?: string | null,
    categoryId?: string,
  ) {
    if (walletId) {
      const wallet = await this.prisma.wallet.findFirst({
        where: { id: walletId, user_id: userId },
        select: { id: true },
      });
      if (!wallet)
        throw new ForbiddenException('Wallet not found or not owned');
    }

    if (toWalletId) {
      const wallet = await this.prisma.wallet.findFirst({
        where: { id: toWalletId, user_id: userId },
        select: { id: true },
      });
      if (!wallet)
        throw new ForbiddenException(
          'Destination wallet not found or not owned',
        );
    }

    if (categoryId) {
      const category = await this.prisma.category.findFirst({
        where: {
          id: categoryId,
          OR: [{ user_id: userId }, { is_default: true }],
        },
        select: { id: true },
      });
      if (!category)
        throw new ForbiddenException('Category not found or not owned');
    }
  }

  private async adjustBalances(
    tx: Prisma.TransactionClient,
    type: TransactionType,
    amount: Prisma.Decimal,
    walletId: string,
    toWalletId?: string | null,
  ) {
    switch (type) {
      case TransactionType.income:
        await tx.wallet.update({
          where: { id: walletId },
          data: { balance: { increment: amount } },
        });
        break;
      case TransactionType.expense:
        await tx.wallet.update({
          where: { id: walletId },
          data: { balance: { decrement: amount } },
        });
        break;
      case TransactionType.transfer:
        await tx.wallet.update({
          where: { id: walletId },
          data: { balance: { decrement: amount } },
        });
        if (toWalletId) {
          await tx.wallet.update({
            where: { id: toWalletId },
            data: { balance: { increment: amount } },
          });
        }
        break;
    }
  }

  private async reverseBalances(
    tx: Prisma.TransactionClient,
    type: TransactionType,
    amount: Prisma.Decimal,
    walletId: string,
    toWalletId?: string | null,
  ) {
    switch (type) {
      case TransactionType.income:
        await tx.wallet.update({
          where: { id: walletId },
          data: { balance: { decrement: amount } },
        });
        break;
      case TransactionType.expense:
        await tx.wallet.update({
          where: { id: walletId },
          data: { balance: { increment: amount } },
        });
        break;
      case TransactionType.transfer:
        await tx.wallet.update({
          where: { id: walletId },
          data: { balance: { increment: amount } },
        });
        if (toWalletId) {
          await tx.wallet.update({
            where: { id: toWalletId },
            data: { balance: { decrement: amount } },
          });
        }
        break;
    }
  }
}
