import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma';
import { FirebaseModule } from './firebase';
import { AuthModule } from './auth';
import { UserModule } from './user/user.module';
import { WalletModule } from './wallet/wallet.module';
import { CategoryModule } from './category/category.module';
import { TransactionModule } from './transaction/transaction.module';
import { BudgetModule } from './budget/budget.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    FirebaseModule,
    AuthModule,
    UserModule,
    WalletModule,
    CategoryModule,
    TransactionModule,
    BudgetModule,
  ],
})
export class AppModule {}
