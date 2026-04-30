import { randomUUID } from 'node:crypto';

import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {
  BadRequestException,
  Injectable,
  Logger,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const MAX_BYTES = 500 * 1024;
const ALLOWED_MIMES = ['image/webp', 'image/jpeg'] as const;
type AllowedMime = (typeof ALLOWED_MIMES)[number];
type AllowedExt = 'webp' | 'jpg';

export interface AssertedImage {
  mime: AllowedMime;
  ext: AllowedExt;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly bucket: string | null;
  private readonly publicBaseUrl: string;
  private readonly client: S3Client | null;

  private readonly memoryObjects = new Map<string, Buffer>();
  private readonly putKeys: string[] = [];
  private readonly deletedKeys: string[] = [];

  constructor(config: ConfigService) {
    const bucket = config.get<string>('R2_BUCKET');
    if (bucket) {
      const accountId = config.get<string>('R2_ACCOUNT_ID');
      const accessKeyId = config.get<string>('R2_ACCESS_KEY_ID');
      const secretAccessKey = config.get<string>('R2_SECRET_ACCESS_KEY');
      const publicBaseUrl = config.get<string>('R2_PUBLIC_BASE_URL');
      if (!accountId || !accessKeyId || !secretAccessKey || !publicBaseUrl) {
        throw new Error(
          'R2_BUCKET set but R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, or R2_PUBLIC_BASE_URL is missing',
        );
      }
      this.bucket = bucket;
      this.publicBaseUrl = publicBaseUrl.replace(/\/$/, '');
      this.client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey },
      });
      this.logger.log(`StorageService mode=r2 bucket=${bucket}`);
    } else {
      if (config.get<string>('NODE_ENV') === 'production') {
        throw new Error(
          'StorageService refuses to start in memory mode under NODE_ENV=production. Populate R2_BUCKET and credentials.',
        );
      }
      this.bucket = null;
      this.publicBaseUrl = 'http://localhost/fake-r2';
      this.client = null;
      this.logger.log('StorageService mode=memory (R2_BUCKET unset)');
    }
  }

  assertImageBuffer(buffer: Buffer, declaredMime: string, size: number): AssertedImage {
    if (size > MAX_BYTES) {
      throw new PayloadTooLargeException(`Image must be at most ${MAX_BYTES} bytes, got ${size}`);
    }
    if (!ALLOWED_MIMES.includes(declaredMime as AllowedMime)) {
      throw new UnsupportedMediaTypeException(
        `Image MIME must be one of ${ALLOWED_MIMES.join(', ')}, got ${declaredMime}`,
      );
    }
    const detected = detectMagicBytes(buffer);
    if (detected === null) {
      throw new BadRequestException('Image bytes are not a valid WebP or JPEG');
    }
    if (detected !== declaredMime) {
      throw new BadRequestException(
        `Declared MIME ${declaredMime} does not match the image bytes (${detected})`,
      );
    }
    return {
      mime: detected,
      ext: detected === 'image/webp' ? 'webp' : 'jpg',
    };
  }

  buildKey(requestId: string, ext: AllowedExt): string {
    return `requests/${requestId}/${randomUUID()}.${ext}`;
  }

  async putImage(buffer: Buffer, contentType: AllowedMime, key: string): Promise<{ url: string }> {
    if (this.client && this.bucket) {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        }),
      );
    } else {
      // Memory-mode bookkeeping is intentionally scoped to !R2: in R2 mode
      // the source of truth is Cloudflare and there is no in-memory state to
      // expose, so the snapshot returns empty arrays.
      this.memoryObjects.set(key, buffer);
      this.putKeys.push(key);
    }
    return { url: `${this.publicBaseUrl}/${key}` };
  }

  async deleteImage(key: string): Promise<void> {
    if (this.client && this.bucket) {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } else {
      this.memoryObjects.delete(key);
      this.deletedKeys.push(key);
    }
  }

  __memorySnapshot(): { put: string[]; deleted: string[]; live: string[] } {
    return {
      put: [...this.putKeys],
      deleted: [...this.deletedKeys],
      live: [...this.memoryObjects.keys()],
    };
  }
}

function detectMagicBytes(buffer: Buffer): AllowedMime | null {
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF') {
    if (buffer.subarray(8, 12).toString('ascii') === 'WEBP') {
      return 'image/webp';
    }
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  return null;
}
