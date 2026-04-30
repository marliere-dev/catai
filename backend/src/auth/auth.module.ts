import { Module } from '@nestjs/common';

import { AuthGuard } from './auth.guard';
import { FirebaseAdminTokenValidator } from './firebase-admin-token-validator';

@Module({
  providers: [AuthGuard, FirebaseAdminTokenValidator],
  exports: [AuthGuard, FirebaseAdminTokenValidator],
})
export class AuthModule {}
