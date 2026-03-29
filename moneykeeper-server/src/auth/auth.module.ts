import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { FirebaseModule } from '../firebase';
import { FirebaseAuthGuard } from './guards';
import { RolesGuard } from './guards';

@Module({
  imports: [FirebaseModule],
  providers: [
    { provide: APP_GUARD, useClass: FirebaseAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}
