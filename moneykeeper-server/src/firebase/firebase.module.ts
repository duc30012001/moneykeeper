import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

const firebaseProvider = {
  provide: 'FIREBASE_ADMIN',
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    if (admin.apps.length) {
      return admin.app();
    }

    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.get<string>('FIREBASE_PROJECT_ID'),
        clientEmail: config.get<string>('FIREBASE_CLIENT_EMAIL'),
        privateKey: config
          .get<string>('FIREBASE_PRIVATE_KEY')
          ?.replace(/\\n/g, '\n'),
      }),
    });
  },
};

@Module({
  imports: [ConfigModule],
  providers: [firebaseProvider],
  exports: [firebaseProvider],
})
export class FirebaseModule {}
