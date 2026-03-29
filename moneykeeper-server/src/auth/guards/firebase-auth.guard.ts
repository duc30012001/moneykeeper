import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from '../../prisma';

const DEFAULT_CATEGORIES = [
  {
    name: 'Food & Dining',
    type: 'expense',
    icon: 'restaurant',
    is_default: true,
  },
  {
    name: 'Transportation',
    type: 'expense',
    icon: 'directions_car',
    is_default: true,
  },
  {
    name: 'Housing & Utilities',
    type: 'expense',
    icon: 'home',
    is_default: true,
  },
  { name: 'Shopping', type: 'expense', icon: 'shopping_bag', is_default: true },
  {
    name: 'Entertainment',
    type: 'expense',
    icon: 'attractions',
    is_default: true,
  },
  {
    name: 'Health & Fitness',
    type: 'expense',
    icon: 'fitness_center',
    is_default: true,
  },
  { name: 'Salary', type: 'income', icon: 'payments', is_default: true },
  { name: 'Gifts', type: 'income', icon: 'card_giftcard', is_default: true },
  {
    name: 'Investments',
    type: 'income',
    icon: 'trending_up',
    is_default: true,
  },
  { name: 'Other Income', type: 'income', icon: 'category', is_default: true },
] as const;

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    @Inject('FIREBASE_ADMIN') private readonly firebaseApp: admin.app.App,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid authorization header',
      );
    }

    const token = authHeader.split('Bearer ')[1];

    try {
      const decodedToken = await this.firebaseApp.auth().verifyIdToken(token);

      // Auto-create user on first login
      let user = await this.prisma.user.findUnique({
        where: { id: decodedToken.uid },
      });

      if (!user) {
        user = await this.createNewUser(decodedToken);
      }

      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private async createNewUser(decodedToken: admin.auth.DecodedIdToken) {
    return this.prisma.user.create({
      data: {
        id: decodedToken.uid,
        email: decodedToken.email!,
        display_name: decodedToken.name || null,
        avatar_url: decodedToken.picture || null,
        categories: {
          createMany: {
            data: DEFAULT_CATEGORIES.map((category) => ({ ...category })),
          },
        },
        wallets: {
          create: {
            name: 'Cash',
            initial_balance: 0,
            balance: 0,
          },
        },
      },
    });
  }
}
