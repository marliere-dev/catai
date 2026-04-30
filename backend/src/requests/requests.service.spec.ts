import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FindOperator, Repository } from 'typeorm';

import { LocationService } from '../location/location.service';
import { StorageService } from '../storage/storage.service';
import { User, UserRole } from '../users/user.entity';
import { CollectionRequest } from './collection-request.entity';
import { CreateRequestDto } from './dto/create-request.dto';
import { ListAvailableRequestsQuery } from './dto/list-available-requests.query';
import { RequestImage } from './request-image.entity';
import { MaterialType, QuantityEstimate, RequestStatus, UploadedImage } from './request.types';
import { RequestsService } from './requests.service';

const WEBP_BUFFER = Buffer.from([
  0x52, 0x49, 0x46, 0x46, 0x1a, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20,
]);

function buildFile(
  buffer: Buffer = WEBP_BUFFER,
  mimetype = 'image/webp',
  size = WEBP_BUFFER.length,
): UploadedImage {
  return { buffer, mimetype, size };
}

function matchesWhereClause(row: CollectionRequest, key: string, expected: unknown): boolean {
  const actual = (row as unknown as Record<string, unknown>)[key];
  if (expected instanceof FindOperator) {
    if (expected.type === 'in') {
      return (expected.value as unknown[]).includes(actual);
    }
    return false;
  }
  return actual === expected;
}

class InMemoryRequestsRepository {
  private rows: CollectionRequest[] = [];
  private nextId = 1;

  create(partial: Partial<CollectionRequest>): CollectionRequest {
    return { ...partial } as CollectionRequest;
  }

  async find(args: {
    where?: Record<string, unknown>;
    order?: unknown;
    take?: number;
    relations?: unknown;
  }): Promise<CollectionRequest[]> {
    const where = args.where ?? {};
    const matching = this.rows.filter((row) =>
      Object.keys(where).every((k) => matchesWhereClause(row, k, where[k])),
    );
    return args.take ? matching.slice(0, args.take) : matching;
  }

  async findOne(args: {
    where: Partial<CollectionRequest>;
    relations?: unknown;
  }): Promise<CollectionRequest | null> {
    const where = args.where;
    return (
      this.rows.find((row) =>
        (Object.keys(where) as Array<keyof CollectionRequest>).every((k) => row[k] === where[k]),
      ) ?? null
    );
  }

  async save(entity: CollectionRequest): Promise<CollectionRequest> {
    if (!entity.id) {
      entity.id = `req-${this.nextId++}`;
      entity.createdAt = new Date();
      entity.updatedAt = new Date();
      this.rows.push(entity);
      return entity;
    }
    const idx = this.rows.findIndex((r) => r.id === entity.id);
    if (idx === -1) {
      this.rows.push(entity);
      return entity;
    }
    this.rows[idx] = { ...entity, updatedAt: new Date() };
    return this.rows[idx];
  }

  async update(
    criteria: Partial<CollectionRequest>,
    partial: Partial<CollectionRequest>,
  ): Promise<{ affected: number }> {
    let affected = 0;
    for (const row of this.rows) {
      const matches = (Object.keys(criteria) as Array<keyof CollectionRequest>).every(
        (k) => row[k] === criteria[k],
      );
      if (matches) {
        Object.assign(row, partial, { updatedAt: new Date() });
        affected++;
      }
    }
    return { affected };
  }

  async delete(idOrCriteria: string | Partial<CollectionRequest>): Promise<{ affected: number }> {
    const id = typeof idOrCriteria === 'string' ? idOrCriteria : idOrCriteria.id;
    const idx = this.rows.findIndex((r) => r.id === id);
    if (idx === -1) {
      return { affected: 0 };
    }
    this.rows.splice(idx, 1);
    return { affected: 1 };
  }

  raw(): CollectionRequest[] {
    return this.rows;
  }
}

// Mimics how TypeORM hydrates the `image` relation on CollectionRequest after
// a save/delete; the real ORM does this via JoinColumn metadata, the fake does
// it by reaching into the parent rows.
class InMemoryRequestImagesRepository {
  private rows: RequestImage[] = [];
  private nextId = 1;

  constructor(private readonly requests: InMemoryRequestsRepository) {}

  create(partial: Partial<RequestImage>): RequestImage {
    return { ...partial } as RequestImage;
  }

  async save(entity: RequestImage): Promise<RequestImage> {
    if (!entity.id) {
      entity.id = `img-${this.nextId++}`;
      entity.createdAt = new Date();
      this.rows.push(entity);
    } else {
      const idx = this.rows.findIndex((r) => r.id === entity.id);
      if (idx >= 0) {
        this.rows[idx] = entity;
      }
    }
    const target = this.requests.raw().find((r) => r.id === entity.requestId);
    if (target) {
      target.image = entity;
    }
    return entity;
  }

  async delete(criteria: Partial<RequestImage>): Promise<{ affected: number }> {
    const id = criteria.id;
    const idx = this.rows.findIndex((r) => r.id === id);
    if (idx === -1) {
      return { affected: 0 };
    }
    const [removed] = this.rows.splice(idx, 1);
    const target = this.requests.raw().find((r) => r.id === removed.requestId);
    if (target) {
      target.image = null;
    }
    return { affected: 1 };
  }

  raw(): RequestImage[] {
    return this.rows;
  }
}

// Wraps the real StorageService in memory mode and adds failure-injection
// flags. Reuses the production validation (size + MIME + magic-bytes) so the
// service-level tests exercise the same anti-spoof logic the controller uses.
class TestStorage extends StorageService {
  failNextPut = false;
  failNextDelete = false;

  override async putImage(buffer: Buffer, mime: 'image/webp' | 'image/jpeg', key: string) {
    if (this.failNextPut) {
      this.failNextPut = false;
      throw new Error('R2 unavailable');
    }
    return super.putImage(buffer, mime, key);
  }

  override async deleteImage(key: string) {
    if (this.failNextDelete) {
      this.failNextDelete = false;
      throw new Error('R2 delete failed');
    }
    return super.deleteImage(key);
  }

  get put(): string[] {
    return this.__memorySnapshot().put;
  }

  get deleted(): string[] {
    return this.__memorySnapshot().deleted;
  }
}

function buildUser(overrides: Partial<User>): User {
  return {
    id: overrides.id ?? 'user-fallback',
    firebaseUid: overrides.firebaseUid ?? 'uid-fallback',
    name: overrides.name ?? 'Test',
    email: overrides.email ?? 'x@example.com',
    role: overrides.role ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
    disabledAt: null,
  } as User;
}

function buildService(): {
  service: RequestsService;
  repo: InMemoryRequestsRepository;
  images: InMemoryRequestImagesRepository;
  storage: TestStorage;
} {
  const repo = new InMemoryRequestsRepository();
  const images = new InMemoryRequestImagesRepository(repo);
  const storageConfig = {
    get: (_key: string) => undefined,
  } as unknown as ConfigService;
  const storage = new TestStorage(storageConfig);
  const config = {
    get: (key: string) => (key === 'RESERVE_TTL_HOURS' ? '2' : undefined),
  } as unknown as ConfigService;
  const service = new RequestsService(
    repo as unknown as Repository<CollectionRequest>,
    images as unknown as Repository<RequestImage>,
    new LocationService(),
    storage,
    config,
  );
  return { service, repo, images, storage };
}

const baseDto: CreateRequestDto = {
  materialType: MaterialType.ALUMINUM,
  quantityEstimate: QuantityEstimate.SMALL,
  latitude: -23.5505,
  longitude: -46.6333,
};

describe('RequestsService', () => {
  describe('create', () => {
    it('rejects creators that are not OWNER', async () => {
      const { service } = buildService();
      const collector = buildUser({ id: 'u-c', role: UserRole.COLLECTOR });
      await expect(service.create(collector, baseDto, buildFile())).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('rejects when image is missing (image is required, §159 + critério #4)', async () => {
      const { service } = buildService();
      const owner = buildUser({ id: 'u-o', role: UserRole.OWNER });
      await expect(service.create(owner, baseDto, undefined)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects oversize images (rule §457 #8)', async () => {
      const { service } = buildService();
      const owner = buildUser({ id: 'u-o', role: UserRole.OWNER });
      const big = buildFile(WEBP_BUFFER, 'image/webp', 600 * 1024);
      await expect(service.create(owner, baseDto, big)).rejects.toBeInstanceOf(
        PayloadTooLargeException,
      );
    });

    it('rejects MIME types outside the allow-list', async () => {
      const { service } = buildService();
      const owner = buildUser({ id: 'u-o', role: UserRole.OWNER });
      await expect(
        service.create(owner, baseDto, buildFile(WEBP_BUFFER, 'image/png', WEBP_BUFFER.length)),
      ).rejects.toBeInstanceOf(UnsupportedMediaTypeException);
    });

    it('persists request + image on the happy path', async () => {
      const { service, repo, images, storage } = buildService();
      const owner = buildUser({ id: 'u-o', role: UserRole.OWNER });
      const created = await service.create(owner, baseDto, buildFile());
      expect(created.status).toBe(RequestStatus.OPEN);
      expect(created.image).toBeTruthy();
      expect(created.image?.imageUrl).toMatch(/^http:\/\/localhost\/fake-r2\//);
      expect(repo.raw()).toHaveLength(1);
      expect(images.raw()).toHaveLength(1);
      expect(storage.put).toHaveLength(1);
    });

    it('rolls back the request when image upload fails', async () => {
      const { service, repo, images, storage } = buildService();
      const owner = buildUser({ id: 'u-o', role: UserRole.OWNER });
      storage.failNextPut = true;
      await expect(service.create(owner, baseDto, buildFile())).rejects.toThrow('R2 unavailable');
      expect(repo.raw()).toHaveLength(0);
      expect(images.raw()).toHaveLength(0);
    });

    it('deletes the R2 object if the DB row save fails after a successful PUT', async () => {
      const { service, repo, storage, images } = buildService();
      const owner = buildUser({ id: 'u-o', role: UserRole.OWNER });
      const originalSave = images.save.bind(images);
      images.save = jest
        .fn()
        .mockRejectedValueOnce(new Error('DB hiccup'))
        .mockImplementation(originalSave);

      await expect(service.create(owner, baseDto, buildFile())).rejects.toThrow('DB hiccup');
      expect(repo.raw()).toHaveLength(0);
      expect(storage.deleted).toHaveLength(1);
      expect(storage.put[0]).toBe(storage.deleted[0]);
    });

    it('rejects invalid coordinates', async () => {
      const { service } = buildService();
      const owner = buildUser({ id: 'u-o', role: UserRole.OWNER });
      await expect(
        service.create(owner, { ...baseDto, latitude: 999 }, buildFile()),
      ).rejects.toThrow();
    });
  });

  describe('attachImage / removeImage', () => {
    async function buildOpenRequest() {
      const ctx = buildService();
      const owner = buildUser({ id: 'u-o', role: UserRole.OWNER });
      const created = await ctx.service.create(owner, baseDto, buildFile());
      return { ...ctx, owner, request: created };
    }

    it('attachImage rejects a non-creator', async () => {
      const { service, request } = await buildOpenRequest();
      // remove the existing image first
      const owner = buildUser({ id: 'u-o', role: UserRole.OWNER });
      await service.removeImage(owner, request.id);

      const stranger = buildUser({ id: 'u-s', role: UserRole.OWNER });
      await expect(service.attachImage(stranger, request.id, buildFile())).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('attachImage rejects when an image already exists', async () => {
      const { service, owner, request } = await buildOpenRequest();
      await expect(service.attachImage(owner, request.id, buildFile())).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('attachImage rejects when request is not OPEN', async () => {
      const { service, owner, request } = await buildOpenRequest();
      await service.removeImage(owner, request.id);
      const collector = buildUser({ id: 'u-c', role: UserRole.COLLECTOR });
      await service.reserve(collector, request.id);
      await expect(service.attachImage(owner, request.id, buildFile())).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('removeImage drops the row and asks storage to delete the key', async () => {
      const { service, owner, request, storage, images } = await buildOpenRequest();
      const key = storage.put[0];
      await service.removeImage(owner, request.id);
      expect(storage.deleted).toContain(key);
      expect(images.raw()).toHaveLength(0);
    });

    it('removeImage rejects when there is no image', async () => {
      const { service, owner, request } = await buildOpenRequest();
      await service.removeImage(owner, request.id);
      await expect(service.removeImage(owner, request.id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('reserve', () => {
    it('rejects users who are not COLLECTOR', async () => {
      const { service } = buildService();
      const owner = buildUser({ id: 'u-o', role: UserRole.OWNER });
      const created = await service.create(owner, baseDto, buildFile());
      const otherOwner = buildUser({ id: 'u-o2', role: UserRole.OWNER });
      await expect(service.reserve(otherOwner, created.id)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('moves an OPEN request to RESERVED with reserved_until set', async () => {
      const { service } = buildService();
      const owner = buildUser({ id: 'u-o', role: UserRole.OWNER });
      const collector = buildUser({ id: 'u-c', role: UserRole.COLLECTOR });
      const created = await service.create(owner, baseDto, buildFile());
      const reserved = await service.reserve(collector, created.id);
      expect(reserved.status).toBe(RequestStatus.RESERVED);
      expect(reserved.reservedByUserId).toBe(collector.id);
      expect(reserved.reservedUntil).toBeInstanceOf(Date);
      expect((reserved.reservedUntil as Date).getTime()).toBeGreaterThan(Date.now());
    });

    it('rejects a second reservation while the first is active', async () => {
      const { service } = buildService();
      const owner = buildUser({ id: 'u-o', role: UserRole.OWNER });
      const collectorA = buildUser({ id: 'u-c-a', role: UserRole.COLLECTOR });
      const collectorB = buildUser({ id: 'u-c-b', role: UserRole.COLLECTOR });
      const created = await service.create(owner, baseDto, buildFile());
      await service.reserve(collectorA, created.id);
      await expect(service.reserve(collectorB, created.id)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('lets only one of two concurrent reservations succeed (atomic update)', async () => {
      const { service } = buildService();
      const owner = buildUser({ id: 'u-o', role: UserRole.OWNER });
      const collectorA = buildUser({ id: 'u-c-a', role: UserRole.COLLECTOR });
      const collectorB = buildUser({ id: 'u-c-b', role: UserRole.COLLECTOR });
      const created = await service.create(owner, baseDto, buildFile());

      const results = await Promise.allSettled([
        service.reserve(collectorA, created.id),
        service.reserve(collectorB, created.id),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
    });

    it('rejects reserving an EXPIRED request', async () => {
      const { service, repo } = buildService();
      const owner = buildUser({ id: 'u-o', role: UserRole.OWNER });
      const collector = buildUser({ id: 'u-c', role: UserRole.COLLECTOR });
      const created = await service.create(owner, baseDto, buildFile());
      created.status = RequestStatus.EXPIRED;
      created.expiredAt = new Date();
      await repo.save(created);

      await expect(service.reserve(collector, created.id)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('reverts a stale reservation to OPEN before reserving (lazy expiry)', async () => {
      const { service, repo } = buildService();
      const owner = buildUser({ id: 'u-o', role: UserRole.OWNER });
      const collectorA = buildUser({ id: 'u-c-a', role: UserRole.COLLECTOR });
      const collectorB = buildUser({ id: 'u-c-b', role: UserRole.COLLECTOR });
      const created = await service.create(owner, baseDto, buildFile());
      const reserved = await service.reserve(collectorA, created.id);

      reserved.reservedUntil = new Date(Date.now() - 1_000);
      await repo.save(reserved);

      const reReserved = await service.reserve(collectorB, created.id);
      expect(reReserved.status).toBe(RequestStatus.RESERVED);
      expect(reReserved.reservedByUserId).toBe(collectorB.id);
    });
  });

  describe('complete', () => {
    it('rejects completion by a non-reserving collector who is not the creator', async () => {
      const { service } = buildService();
      const owner = buildUser({ id: 'u-o', role: UserRole.OWNER });
      const collectorA = buildUser({ id: 'u-c-a', role: UserRole.COLLECTOR });
      const collectorB = buildUser({ id: 'u-c-b', role: UserRole.COLLECTOR });
      const created = await service.create(owner, baseDto, buildFile());
      await service.reserve(collectorA, created.id);
      await expect(service.complete(collectorB, created.id)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('allows the reserving collector to complete', async () => {
      const { service } = buildService();
      const owner = buildUser({ id: 'u-o', role: UserRole.OWNER });
      const collector = buildUser({ id: 'u-c', role: UserRole.COLLECTOR });
      const created = await service.create(owner, baseDto, buildFile());
      await service.reserve(collector, created.id);
      const done = await service.complete(collector, created.id);
      expect(done.status).toBe(RequestStatus.COMPLETED);
      expect(done.completedAt).toBeInstanceOf(Date);
    });

    it('allows the creator to complete a reserved request (§220-222)', async () => {
      const { service } = buildService();
      const owner = buildUser({ id: 'u-o', role: UserRole.OWNER });
      const collector = buildUser({ id: 'u-c', role: UserRole.COLLECTOR });
      const created = await service.create(owner, baseDto, buildFile());
      await service.reserve(collector, created.id);
      const done = await service.complete(owner, created.id);
      expect(done.status).toBe(RequestStatus.COMPLETED);
    });

    it('asks storage to delete the image on completion', async () => {
      const { service, storage } = buildService();
      const owner = buildUser({ id: 'u-o', role: UserRole.OWNER });
      const collector = buildUser({ id: 'u-c', role: UserRole.COLLECTOR });
      const created = await service.create(owner, baseDto, buildFile());
      const key = storage.put[0];
      await service.reserve(collector, created.id);
      await service.complete(collector, created.id);
      expect(storage.deleted).toContain(key);
    });

    it('rejects completion of an OPEN request', async () => {
      const { service } = buildService();
      const owner = buildUser({ id: 'u-o', role: UserRole.OWNER });
      const collector = buildUser({ id: 'u-c', role: UserRole.COLLECTOR });
      const created = await service.create(owner, baseDto, buildFile());
      await expect(service.complete(collector, created.id)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('cancel', () => {
    it('rejects cancellation by a non-creator', async () => {
      const { service } = buildService();
      const owner = buildUser({ id: 'u-o', role: UserRole.OWNER });
      const otherOwner = buildUser({ id: 'u-o2', role: UserRole.OWNER });
      const created = await service.create(owner, baseDto, buildFile());
      await expect(service.cancel(otherOwner, created.id)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('cancels an OPEN request and asks storage to delete the image', async () => {
      const { service, storage } = buildService();
      const owner = buildUser({ id: 'u-o', role: UserRole.OWNER });
      const created = await service.create(owner, baseDto, buildFile());
      const key = storage.put[0];
      const cancelled = await service.cancel(owner, created.id);
      expect(cancelled.status).toBe(RequestStatus.CANCELLED);
      expect(storage.deleted).toContain(key);
    });

    it('still cancels even if storage.deleteImage fails (best-effort)', async () => {
      const { service, storage } = buildService();
      const owner = buildUser({ id: 'u-o', role: UserRole.OWNER });
      const created = await service.create(owner, baseDto, buildFile());
      storage.failNextDelete = true;
      const cancelled = await service.cancel(owner, created.id);
      expect(cancelled.status).toBe(RequestStatus.CANCELLED);
    });

    it('rejects cancelling a RESERVED request (§782 critério #10)', async () => {
      const { service } = buildService();
      const owner = buildUser({ id: 'u-o', role: UserRole.OWNER });
      const collector = buildUser({ id: 'u-c', role: UserRole.COLLECTOR });
      const created = await service.create(owner, baseDto, buildFile());
      await service.reserve(collector, created.id);
      await expect(service.cancel(owner, created.id)).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects cancelling a COMPLETED request', async () => {
      const { service } = buildService();
      const owner = buildUser({ id: 'u-o', role: UserRole.OWNER });
      const collector = buildUser({ id: 'u-c', role: UserRole.COLLECTOR });
      const created = await service.create(owner, baseDto, buildFile());
      await service.reserve(collector, created.id);
      await service.complete(collector, created.id);
      await expect(service.cancel(owner, created.id)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('listAvailable', () => {
    const query: ListAvailableRequestsQuery = {
      lat: -23.5505,
      lng: -46.6333,
      radiusKm: 5,
    };

    it('rejects callers that are not COLLECTOR', async () => {
      const { service } = buildService();
      const owner = buildUser({ id: 'u-o', role: UserRole.OWNER });
      await expect(service.listAvailable(owner, query)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('returns OPEN requests within the radius, sorted by proximity', async () => {
      const { service } = buildService();
      const owner = buildUser({ id: 'u-o', role: UserRole.OWNER });
      const collector = buildUser({ id: 'u-c', role: UserRole.COLLECTOR });
      const near = await service.create(
        owner,
        { ...baseDto, latitude: -23.5505, longitude: -46.6333 },
        buildFile(),
      );
      const middle = await service.create(
        owner,
        { ...baseDto, latitude: -23.553, longitude: -46.638 },
        buildFile(),
      );
      const far = await service.create(
        owner,
        { ...baseDto, latitude: -22.9068, longitude: -43.1729 },
        buildFile(),
      );

      const results = await service.listAvailable(collector, query);
      const ids = results.map((r) => r.id);
      expect(ids).toEqual([near.id, middle.id]);
      expect(ids).not.toContain(far.id);
      expect(results[0].distanceKm).toBeLessThan(results[1].distanceKm);
    });

    it('omits requests whose reservation has expired only after lazy reversion', async () => {
      const { service, repo } = buildService();
      const owner = buildUser({ id: 'u-o', role: UserRole.OWNER });
      const collectorA = buildUser({ id: 'u-c-a', role: UserRole.COLLECTOR });
      const collectorB = buildUser({ id: 'u-c-b', role: UserRole.COLLECTOR });
      const created = await service.create(owner, baseDto, buildFile());
      const reserved = await service.reserve(collectorA, created.id);
      reserved.reservedUntil = new Date(Date.now() - 1_000);
      await repo.save(reserved);

      const results = await service.listAvailable(collectorB, query);
      expect(results.map((r) => r.id)).toContain(created.id);
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException for unknown ids', async () => {
      const { service } = buildService();
      await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
