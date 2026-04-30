import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Request } from 'express';

import { FirebaseUser } from '../firebase-token-validator';

export interface RequestWithFirebaseUser extends Request {
  firebaseUser?: FirebaseUser;
}

export const CurrentFirebaseUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): FirebaseUser => {
    const req = ctx.switchToHttp().getRequest<RequestWithFirebaseUser>();
    if (!req.firebaseUser) {
      throw new Error('CurrentFirebaseUser used on a route without AuthGuard');
    }
    return req.firebaseUser;
  },
);
