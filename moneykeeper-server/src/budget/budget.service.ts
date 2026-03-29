import { Injectable, NotFoundException } from '@nestjs/common';
import { BudgetPeriod, Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma';
import { CreateBudgetDto, UpdateBudgetDto } from './dto';

@Injectable()
export class BudgetService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.budget.findMany({
      where: { user_id: userId },
      include: {
        category: { select: { id: true, name: true, icon: true } },
        wallet: { select: { id: true, name: true } },
      },
      orderBy: [{ sort_order: 'asc' }, { created_at: 'desc' }],
    });
  }

  async findOne(id: string, userId: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { id, user_id: userId },
      include: {
        category: { select: { id: true, name: true, icon: true } },
        wallet: { select: { id: true, name: true } },
      },
    });
    if (!budget) throw new NotFoundException('Budget not found');
    return budget;
  }

  create(dto: CreateBudgetDto, userId: string) {
    return this.prisma.budget.create({
      data: {
        name: dto.name || '',
        amount: new Prisma.Decimal(dto.amount),
        period: dto.period,
        is_global: dto.is_global ?? false,
        category_id: dto.category_id,
        wallet_id: dto.wallet_id,
        user_id: userId,
      },
    });
  }

  async update(id: string, dto: UpdateBudgetDto, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.budget.update({
      where: { id },
      data: {
        name: dto.name,
        amount: dto.amount ? new Prisma.Decimal(dto.amount) : undefined,
        period: dto.period,
        sort_order: dto.sort_order,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.budget.delete({ where: { id } });
  }

  async reorder(items: { id: string; sort_order: number }[], userId: string) {
    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.budget.updateMany({
          where: { id: item.id, user_id: userId },
          data: { sort_order: item.sort_order },
        }),
      ),
    );
    return { success: true };
  }

  async getBudgetSummary(userId: string) {
    const budgets = await this.prisma.budget.findMany({
      where: { user_id: userId },
      include: {
        category: { select: { id: true, name: true, icon: true } },
        wallet: { select: { id: true, name: true } },
      },
      orderBy: [{ sort_order: 'asc' }, { created_at: 'desc' }],
    });

    const summaries = await Promise.all(
      budgets.map(async (budget) => {
        const { start, end } = this.getPeriodRange(budget.period);

        const whereClause: Prisma.TransactionWhereInput = {
          user_id: userId,
          type: TransactionType.expense,
          date: { gte: start, lte: end },
        };

        if (budget.category_id) whereClause.category_id = budget.category_id;
        if (budget.wallet_id) whereClause.wallet_id = budget.wallet_id;

        const result = await this.prisma.transaction.aggregate({
          where: whereClause,
          _sum: { amount: true },
        });

        const spent = result._sum.amount ?? new Prisma.Decimal(0);

        return {
          ...budget,
          spent,
          remaining: budget.amount.sub(spent),
          percentage: budget.amount.gt(0)
            ? spent.div(budget.amount).mul(100).toNumber()
            : 0,
        };
      }),
    );

    return summaries;
  }

  private getPeriodRange(period: BudgetPeriod): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    switch (period) {
      case BudgetPeriod.day:
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case BudgetPeriod.week:
        const dayOfWeek = start.getDay();
        start.setDate(start.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case BudgetPeriod.month:
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case BudgetPeriod.year:
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(11, 31);
        end.setHours(23, 59, 59, 999);
        break;
    }

    return { start, end };
  }
}
