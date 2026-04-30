import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { StorageService } from './storage.service';

const IMAGE_MAX_BYTES = 500 * 1024;

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: IMAGE_MAX_BYTES, files: 1 },
    }),
  ],
  providers: [StorageService],
  exports: [StorageService, MulterModule],
})
export class StorageModule {}
