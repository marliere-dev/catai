import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RequestWithFirebaseUser } from './decorators/current-firebase-user.decorator';
import { REQUIRE_EMAIL_VERIFIED_KEY } from './decorators/require-email-verified.decorator';
import { FirebaseAdminTokenValidator } from './firebase-admin-token-validator';
import { FirebaseTokenValidator } from './auth.types';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(FirebaseAdminTokenValidator) private readonly validator: FirebaseTokenValidator,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithFirebaseUser>();
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const user = await this.validator.verify(token);
    req.firebaseUser = user;

    const requiresVerifiedEmail = this.reflector.getAllAndOverride<boolean | undefined>(
      REQUIRE_EMAIL_VERIFIED_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (requiresVerifiedEmail && !user.emailVerified) {
      throw new ForbiddenException('Email is not verified');
    }
    return true;
  }
}
