import { createReadStream, promises as fs } from 'node:fs';
import * as path from 'node:path';

import { Controller, Get, Logger, NotFoundException, Param, Res } from '@nestjs/common';
import type { Response } from 'express';

import { StorageService } from './storage.service';

const VALID_SEGMENT = /^[a-zA-Z0-9_-]+$/;
const VALID_FILENAME = /^[a-zA-Z0-9_-]+\.(?:jpg|webp)$/;

const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
};

@Controller('storage/local')
export class StorageController {
  private readonly logger = new Logger(StorageController.name);

  constructor(private readonly storage: StorageService) {}

  @Get('requests/:requestId/:filename')
  async serve(
    @Param('requestId') requestId: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ): Promise<void> {
    const dir = this.storage.getLocalDir();
    if (!dir) throw new NotFoundException('disk storage is disabled');

    // Sanitização defensiva: nomes só podem ter caracteres seguros, sem
    // separadores ou `..`. Bloqueia path traversal.
    if (!VALID_SEGMENT.test(requestId) || !VALID_FILENAME.test(filename)) {
      throw new NotFoundException('invalid path');
    }

    const filePath = path.join(dir, 'requests', requestId, filename);
    // Garantia adicional: o caminho final deve estar dentro do dir base.
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(dir) + path.sep)) {
      throw new NotFoundException('invalid path');
    }

    try {
      await fs.access(resolved);
    } catch {
      throw new NotFoundException('image not found');
    }

    const ext = path.extname(resolved).toLowerCase();
    const contentType = CONTENT_TYPES[ext] ?? 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    // Cache curto: o disco é mutável e o app pode carregar a foto várias vezes.
    res.setHeader('Cache-Control', 'public, max-age=300');
    createReadStream(resolved).pipe(res);
  }
}
