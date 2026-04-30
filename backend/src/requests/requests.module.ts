import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { LocationModule } from '../location/location.module';
import { StorageModule } from '../storage/storage.module';
import { UsersModule } from '../users/users.module';
import { CollectionRequest } from './collection-request.entity';
import { RequestImage } from './request-image.entity';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CollectionRequest, RequestImage]),
    AuthModule,
    UsersModule,
    LocationModule,
    StorageModule,
  ],
  controllers: [RequestsController],
  providers: [RequestsService],
  exports: [RequestsService],
})
export class RequestsModule {}
