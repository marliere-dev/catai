import { Injectable, UnauthorizedException } from '@nestjs/common';

import { FirebaseTokenValidator, FirebaseUser } from '../auth.types';

@Injectable()
export class FakeFirebaseTokenValidator implements FirebaseTokenValidator {
  private readonly users = new Map<string, FirebaseUser>();

  register(token: string, user: FirebaseUser): void {
    this.users.set(token, user);
  }

  clear(): void {
    this.users.clear();
  }

  async verify(token: string): Promise<FirebaseUser> {
    const user = this.users.get(token);
    if (!user) {
      throw new UnauthorizedException('Invalid Firebase token');
    }
    return user;
  }
}
