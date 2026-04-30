import {
  BadRequestException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { StorageService } from './storage.service';

const WEBP_HEADER = Buffer.from([
  0x52,
  0x49,
  0x46,
  0x46, // RIFF
  0x1a,
  0x00,
  0x00,
  0x00, // file size (placeholder)
  0x57,
  0x45,
  0x42,
  0x50, // WEBP
  0x56,
  0x50,
  0x38,
  0x20, // VP8 chunk header
]);
const JPEG_HEADER = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);

function buildService(env: Record<string, string | undefined> = {}): StorageService {
  const config = {
    get: (key: string) => env[key],
  } as unknown as ConfigService;
  return new StorageService(config);
}

describe('StorageService', () => {
  describe('assertImageBuffer', () => {
    const service = buildService();

    it('rejects payloads larger than 500 KB (rule §457 #8)', () => {
      const big = Buffer.concat([WEBP_HEADER, Buffer.alloc(500 * 1024)]);
      expect(() => service.assertImageBuffer(big, 'image/webp', big.length)).toThrow(
        PayloadTooLargeException,
      );
    });

    it('rejects MIME types outside the allow-list', () => {
      expect(() => service.assertImageBuffer(WEBP_HEADER, 'image/png', WEBP_HEADER.length)).toThrow(
        UnsupportedMediaTypeException,
      );
    });

    it('rejects buffers that are not WebP or JPEG', () => {
      const garbage = Buffer.from('not an image');
      expect(() => service.assertImageBuffer(garbage, 'image/webp', garbage.length)).toThrow(
        BadRequestException,
      );
    });

    it('rejects MIME spoofing (declared WebP, bytes are JPEG)', () => {
      expect(() =>
        service.assertImageBuffer(JPEG_HEADER, 'image/webp', JPEG_HEADER.length),
      ).toThrow(BadRequestException);
    });

    it('accepts a valid WebP buffer', () => {
      expect(service.assertImageBuffer(WEBP_HEADER, 'image/webp', WEBP_HEADER.length)).toEqual({
        mime: 'image/webp',
        ext: 'webp',
      });
    });

    it('accepts a valid JPEG buffer', () => {
      expect(service.assertImageBuffer(JPEG_HEADER, 'image/jpeg', JPEG_HEADER.length)).toEqual({
        mime: 'image/jpeg',
        ext: 'jpg',
      });
    });
  });

  describe('buildKey', () => {
    const service = buildService();

    it('produces a key under requests/<id>/<random>.<ext>', () => {
      const key = service.buildKey('11111111-2222-3333-4444-555555555555', 'webp');
      expect(key).toMatch(/^requests\/11111111-2222-3333-4444-555555555555\/[0-9a-f-]{36}\.webp$/);
    });
  });

  describe('memory mode', () => {
    it('records put + delete operations in the snapshot', async () => {
      const service = buildService();
      const key = service.buildKey('req-1', 'webp');
      const result = await service.putImage(WEBP_HEADER, 'image/webp', key);
      expect(result.url).toBe(`http://localhost/fake-r2/${key}`);

      let snap = service.__memorySnapshot();
      expect(snap.put).toContain(key);
      expect(snap.live).toContain(key);

      await service.deleteImage(key);
      snap = service.__memorySnapshot();
      expect(snap.deleted).toContain(key);
      expect(snap.live).not.toContain(key);
    });
  });

  describe('R2 mode wiring', () => {
    it('throws when R2_BUCKET is set but credentials are missing', () => {
      expect(() => buildService({ R2_BUCKET: 'catai-images-dev' })).toThrow(
        /R2_ACCOUNT_ID|R2_ACCESS_KEY_ID|R2_SECRET_ACCESS_KEY|R2_PUBLIC_BASE_URL/,
      );
    });
  });
});
