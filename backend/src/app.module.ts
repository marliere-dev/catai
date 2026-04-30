import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';
import { typeOrmConfig } from './database/typeorm.config';
import { HealthModule } from './health/health.module';
import { LocationModule } from './location/location.module';
import { RequestsModule } from './requests/requests.module';
import { StorageModule } from './storage/storage.module';
import { UsersModule } from './users/users.module';

const isTestEnv = process.env.NODE_ENV === 'test';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: isTestEnv ? '.env.test' : '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: isTestEnv ? 100_000 : 60,
      },
    ]),
    TypeOrmModule.forRootAsync({
      useFactory: typeOrmConfig,
    }),
    HealthModule,
    AuthModule,
    UsersModule,
    LocationModule,
    StorageModule,
    RequestsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
