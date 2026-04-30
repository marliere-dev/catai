import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { LocationService } from '../location/location.service';
import { StorageService } from '../storage/storage.service';
import { UserRole } from '../users/user-role.enum';
import { User } from '../users/user.entity';
import { CollectionRequest } from './collection-request.entity';
import { CreateRequestDto } from './dto/create-request.dto';
import { ListAvailableRequestsQuery } from './dto/list-available-requests.query';
import { RequestImage } from './request-image.entity';
import { RequestStatus } from './request-status.enum';

const DEFAULT_RADIUS_KM = 10;
const AVAILABLE_LIMIT = 200;

export interface UploadedImage {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

export type AvailableRequest = CollectionRequest & { distanceKm: number };

@Injectable()
export class RequestsService {
  private readonly logger = new Logger(RequestsService.name);
  private readonly reserveTtlMs: number;

  constructor(
    @InjectRepository(CollectionRequest)
    private readonly requests: Repository<CollectionRequest>,
    @InjectRepository(RequestImage)
    private readonly requestImages: Repository<RequestImage>,
    private readonly location: LocationService,
    private readonly storage: StorageService,
    config: ConfigService,
  ) {
    const hours = Number(config.get<string>('RESERVE_TTL_HOURS') ?? '2');
    this.reserveTtlMs = hours * 60 * 60 * 1000;
  }

  async create(
    creator: User,
    dto: CreateRequestDto,
    file: UploadedImage | undefined,
  ): Promise<CollectionRequest> {
    if (creator.role !== UserRole.OWNER) {
      throw new ForbiddenException('Only owners can create collection requests');
    }
    if (!file) {
      throw new BadRequestException('An image is required to create a collection request');
    }
    this.location.validateCoordinates(dto.latitude, dto.longitude);
    const asserted = this.storage.assertImageBuffer(file.buffer, file.mimetype, file.size);

    const entity = this.requests.create({
      createdByUserId: creator.id,
      reservedByUserId: null,
      materialType: dto.materialType,
      quantityEstimate: dto.quantityEstimate,
      notes: dto.notes ?? null,
      latitude: dto.latitude,
      longitude: dto.longitude,
      locationReference: dto.locationReference ?? null,
      status: RequestStatus.OPEN,
      reservedUntil: null,
      completedAt: null,
      cancelledAt: null,
      expiredAt: null,
    });
    const saved = await this.requests.save(entity);

    // No DB transaction spans Postgres + R2. We compensate manually:
    // if the image upload fails, drop the request row to avoid an OPEN
    // request without an image (image is required at creation, §775-779 #4).
    try {
      await this.persistImage(saved.id, file.buffer, asserted.mime, asserted.ext, file.size);
    } catch (err) {
      this.logger.error(
        `Failed to upload image for request ${saved.id}; rolling back: ${(err as Error).message}`,
      );
      try {
        await this.requests.delete(saved.id);
      } catch (deleteErr) {
        this.logger.error(
          `Rollback delete of request ${saved.id} also failed: ${(deleteErr as Error).message}`,
        );
      }
      throw err;
    }

    return this.findOne(saved.id);
  }

  async listMy(user: User): Promise<CollectionRequest[]> {
    const rows = await this.requests.find({
      where: { createdByUserId: user.id },
      order: { createdAt: 'DESC' },
      relations: { image: true },
    });
    return Promise.all(rows.map((row) => this.applyLazyExpiry(row)));
  }

  async listAvailable(
    collector: User,
    query: ListAvailableRequestsQuery,
  ): Promise<AvailableRequest[]> {
    if (collector.role !== UserRole.COLLECTOR) {
      throw new ForbiddenException('Only collectors can browse available requests');
    }
    const radiusKm = query.radiusKm ?? DEFAULT_RADIUS_KM;
    const rows = await this.requests.find({
      where: { status: In([RequestStatus.OPEN, RequestStatus.RESERVED]) },
      relations: { image: true },
      take: AVAILABLE_LIMIT,
    });
    const refreshed = await Promise.all(rows.map((row) => this.applyLazyExpiry(row)));
    return refreshed
      .filter((row) => row.status === RequestStatus.OPEN)
      .map((row): AvailableRequest => {
        row.distanceKm = this.location.calculateDistanceKm(
          query.lat,
          query.lng,
          row.latitude,
          row.longitude,
        );
        return row as AvailableRequest;
      })
      .filter((row) => row.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  async findOne(id: string): Promise<CollectionRequest> {
    const row = await this.requests.findOne({ where: { id }, relations: { image: true } });
    if (!row) {
      throw new NotFoundException('Request not found');
    }
    return this.applyLazyExpiry(row);
  }

  async reserve(collector: User, id: string): Promise<CollectionRequest> {
    if (collector.role !== UserRole.COLLECTOR) {
      throw new ForbiddenException('Only collectors can reserve requests');
    }

    const existing = await this.requests.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Request not found');
    }
    await this.applyLazyExpiry(existing);

    const reservedUntil = new Date(Date.now() + this.reserveTtlMs);
    const result = await this.requests.update(
      { id, status: RequestStatus.OPEN },
      {
        status: RequestStatus.RESERVED,
        reservedByUserId: collector.id,
        reservedUntil,
      },
    );

    if (!result.affected) {
      const current = await this.requests.findOne({ where: { id } });
      throw new ConflictException(
        `Request is ${current?.status ?? 'missing'} and cannot be reserved`,
      );
    }

    return this.findOne(id);
  }

  async complete(user: User, id: string): Promise<CollectionRequest> {
    const row = await this.findOne(id);
    if (row.status !== RequestStatus.RESERVED) {
      throw new ConflictException(`Request is ${row.status} and cannot be completed`);
    }
    const isReservingCollector = row.reservedByUserId === user.id;
    const isCreator = row.createdByUserId === user.id;
    if (!isReservingCollector && !isCreator) {
      throw new ForbiddenException(
        'Only the reserving collector or the creator can complete this request',
      );
    }
    await this.cleanupImage(row);
    row.status = RequestStatus.COMPLETED;
    row.completedAt = new Date();
    return this.requests.save(row);
  }

  async cancel(creator: User, id: string): Promise<CollectionRequest> {
    const row = await this.findOne(id);
    if (row.createdByUserId !== creator.id) {
      throw new ForbiddenException('Only the creator can cancel this request');
    }
    if (row.status !== RequestStatus.OPEN) {
      throw new ConflictException(`Request is ${row.status} and cannot be cancelled`);
    }
    await this.cleanupImage(row);
    row.status = RequestStatus.CANCELLED;
    row.cancelledAt = new Date();
    row.reservedByUserId = null;
    row.reservedUntil = null;
    return this.requests.save(row);
  }

  async attachImage(user: User, requestId: string, file: UploadedImage): Promise<RequestImage> {
    const row = await this.findOne(requestId);
    if (row.createdByUserId !== user.id) {
      throw new ForbiddenException('Only the creator can attach an image');
    }
    if (row.status !== RequestStatus.OPEN) {
      throw new ConflictException(`Request is ${row.status} and cannot accept image changes`);
    }
    if (row.image) {
      throw new ConflictException('Request already has an image; remove it first');
    }
    const asserted = this.storage.assertImageBuffer(file.buffer, file.mimetype, file.size);
    return this.persistImage(row.id, file.buffer, asserted.mime, asserted.ext, file.size);
  }

  async removeImage(user: User, requestId: string): Promise<void> {
    const row = await this.findOne(requestId);
    if (row.createdByUserId !== user.id) {
      throw new ForbiddenException('Only the creator can remove the image');
    }
    if (row.status !== RequestStatus.OPEN) {
      throw new ConflictException(`Request is ${row.status} and cannot accept image changes`);
    }
    if (!row.image) {
      throw new NotFoundException('Request has no image');
    }
    await this.deleteImageBestEffort(row.image.imageKey);
    await this.requestImages.delete({ id: row.image.id });
  }

  private async persistImage(
    requestId: string,
    buffer: Buffer,
    mime: 'image/webp' | 'image/jpeg',
    ext: 'webp' | 'jpg',
    size: number,
  ): Promise<RequestImage> {
    const key = this.storage.buildKey(requestId, ext);
    const { url } = await this.storage.putImage(buffer, mime, key);
    const image = this.requestImages.create({
      requestId,
      imageKey: key,
      imageUrl: url,
      contentType: mime,
      sizeBytes: size,
    });
    try {
      return await this.requestImages.save(image);
    } catch (err) {
      // DB row failed after the R2 PUT succeeded. Drop the orphan to avoid
      // R2 storage cost growing forever.
      await this.deleteImageBestEffort(key);
      throw err;
    }
  }

  private async cleanupImage(row: CollectionRequest): Promise<void> {
    if (!row.image) {
      return;
    }
    const { id, imageKey } = row.image;
    await this.deleteImageBestEffort(imageKey);
    await this.requestImages.delete({ id });
    row.image = null;
  }

  private async deleteImageBestEffort(key: string): Promise<void> {
    try {
      await this.storage.deleteImage(key);
    } catch (err) {
      this.logger.warn(
        `Failed to delete storage object ${key}, leaving orphan: ${(err as Error).message}`,
      );
    }
  }

  private async applyLazyExpiry(row: CollectionRequest): Promise<CollectionRequest> {
    if (
      row.status === RequestStatus.RESERVED &&
      row.reservedUntil !== null &&
      row.reservedUntil.getTime() <= Date.now()
    ) {
      row.status = RequestStatus.OPEN;
      row.reservedByUserId = null;
      row.reservedUntil = null;
      return this.requests.save(row);
    }
    return row;
  }
}
