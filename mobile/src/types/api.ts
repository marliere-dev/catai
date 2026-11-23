// Mirror of backend types (backend/src/requests/request.types.ts) so the
// mobile is loosely typed against the same shape.

export type RequestStatus = 'OPEN' | 'RESERVED' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';

export type MaterialType =
  | 'ALUMINUM'
  | 'CARDBOARD'
  | 'PLASTIC'
  | 'GLASS'
  | 'METAL'
  | 'COOKING_OIL'
  | 'SMALL_ELECTRONICS'
  | 'MIXED';

export type QuantityEstimate = 'SMALL' | 'MEDIUM' | 'LARGE';

export interface RequestImage {
  id: string;
  imageUrl: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface CollectionRequest {
  id: string;
  materialType: MaterialType;
  quantityEstimate: QuantityEstimate;
  notes: string | null;
  latitude: number;
  longitude: number;
  locationReference: string | null;
  status: RequestStatus;
  reservedUntil: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  expiredAt: string | null;
  createdAt: string;
  updatedAt: string;
  image?: RequestImage | null;
  distanceKm?: number;
}

export interface MeUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  disabledAt: string | null;
}

export interface ApiError {
  error: string;
  field?: string;
  statusCode?: number;
}
