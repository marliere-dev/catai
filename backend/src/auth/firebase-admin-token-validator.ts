import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

import { FirebaseTokenValidator, FirebaseUser } from './firebase-token-validator';

@Injectable()
export class FirebaseAdminTokenValidator implements FirebaseTokenValidator {
  private readonly logger = new Logger(FirebaseAdminTokenValidator.name);
  private readonly app: App;

  constructor(config: ConfigService) {
    const projectId = config.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = config.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = config.get<string>('FIREBASE_PRIVATE_KEY');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        'FirebaseAdminTokenValidator requires FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY',
      );
    }

    const existing = getApps().find((a) => a.name === 'catai');
    this.app =
      existing ??
      initializeApp(
        {
          credential: cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
        },
        'catai',
      );
  }

  async verify(token: string): Promise<FirebaseUser> {
    try {
      const decoded = await getAuth(this.app).verifyIdToken(token);
      if (!decoded.email) {
        throw new UnauthorizedException('Firebase token is missing email claim');
      }
      return {
        uid: decoded.uid,
        email: decoded.email,
        emailVerified: decoded.email_verified === true,
      };
    } catch (err) {
      this.logger.warn(`Token verification failed: ${(err as Error).message}`);
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }
}
