import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from '../../prisma';

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
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          id: decodedToken.uid,
          email: decodedToken.email!,
          display_name: decodedToken.name || null,
          avatar_url: decodedToken.picture || null,
          wallets: {
            create: {
              name: 'Tiền mặt',
              initial_balance: 0,
              balance: 0,
            },
          },
        },
      });

      const defaults = await tx.category.findMany({
        where: { is_default: true, user_id: null },
        orderBy: { parent_id: 'asc' },
      });

      const idMap = new Map<string, string>();

      const parents = defaults.filter((c) => !c.parent_id);
      for (const cat of parents) {
        const created = await tx.category.create({
          data: {
            name: cat.name,
            type: cat.type,
            icon: cat.icon,
            user_id: user.id,
          },
        });
        idMap.set(cat.id, created.id);
      }

      const children = defaults.filter((c) => c.parent_id);
      for (const cat of children) {
        await tx.category.create({
          data: {
            name: cat.name,
            type: cat.type,
            icon: cat.icon,
            parent_id: idMap.get(cat.parent_id!),
            user_id: user.id,
          },
        });
      }

      return user;
    });
  }
}
