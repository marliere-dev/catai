import type { CollectionRequest } from './collection-request.entity';

export enum RequestStatus {
  OPEN = 'OPEN',
  RESERVED = 'RESERVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum MaterialType {
  ALUMINUM = 'ALUMINUM',
  CARDBOARD = 'CARDBOARD',
  PLASTIC = 'PLASTIC',
  GLASS = 'GLASS',
  METAL = 'METAL',
  COOKING_OIL = 'COOKING_OIL',
  SMALL_ELECTRONICS = 'SMALL_ELECTRONICS',
  MIXED = 'MIXED',
}

export enum QuantityEstimate {
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
}

export interface UploadedImage {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

export type AvailableRequest = CollectionRequest & { distanceKm: number };
