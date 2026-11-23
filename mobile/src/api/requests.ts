import { Platform } from 'react-native';

import { CollectionRequest, MaterialType, QuantityEstimate, RequestImage } from '@/types/api';

import { apiCall } from './client';

export interface CreateRequestPayload {
  materialType: MaterialType;
  quantityEstimate: QuantityEstimate;
  notes?: string;
  latitude: number;
  longitude: number;
  locationReference?: string;
  image: ImagePayload;
}

interface ImagePayload {
  uri: string;
  name: string;
  type: 'image/webp' | 'image/jpeg';
}

// React Native nativo aceita `{ uri, name, type }` como valor de FormData; em
// web o navegador serializa esse objeto como "[object Object]" e o backend
// rejeita. Em web convertemos o URI (blob: ou data:) num File real.
async function imageToFormDataValue(image: ImagePayload): Promise<Blob | unknown> {
  if (Platform.OS === 'web') {
    const res = await fetch(image.uri);
    const blob = await res.blob();
    return new File([blob], image.name, { type: image.type });
  }
  return { uri: image.uri, name: image.name, type: image.type } as unknown as Blob;
}

async function buildImageFormData(payload: CreateRequestPayload): Promise<FormData> {
  const fd = new FormData();
  fd.append('materialType', payload.materialType);
  fd.append('quantityEstimate', payload.quantityEstimate);
  if (payload.notes) fd.append('notes', payload.notes);
  fd.append('latitude', String(payload.latitude));
  fd.append('longitude', String(payload.longitude));
  if (payload.locationReference) fd.append('locationReference', payload.locationReference);
  const value = await imageToFormDataValue(payload.image);
  fd.append('image', value as Blob, payload.image.name);
  return fd;
}

export const requestsApi = {
  async create(payload: CreateRequestPayload): Promise<CollectionRequest> {
    const formData = await buildImageFormData(payload);
    return apiCall<CollectionRequest>('/requests', { method: 'POST', formData });
  },

  async listMy(): Promise<CollectionRequest[]> {
    return apiCall<CollectionRequest[]>('/requests/my');
  },

  async listReservedByMe(): Promise<CollectionRequest[]> {
    return apiCall<CollectionRequest[]>('/requests/reserved-by-me');
  },

  async listAvailable(params: {
    lat: number;
    lng: number;
    radiusKm?: number;
  }): Promise<CollectionRequest[]> {
    return apiCall<CollectionRequest[]>('/requests/available', { query: params });
  },

  async findOne(id: string): Promise<CollectionRequest> {
    return apiCall<CollectionRequest>(`/requests/${id}`);
  },

  async reserve(id: string): Promise<CollectionRequest> {
    return apiCall<CollectionRequest>(`/requests/${id}/reserve`, { method: 'POST' });
  },

  async complete(id: string): Promise<CollectionRequest> {
    return apiCall<CollectionRequest>(`/requests/${id}/complete`, { method: 'POST' });
  },

  async cancel(id: string): Promise<CollectionRequest> {
    return apiCall<CollectionRequest>(`/requests/${id}/cancel`, { method: 'POST' });
  },

  async attachImage(id: string, image: ImagePayload): Promise<RequestImage> {
    const fd = new FormData();
    const value = await imageToFormDataValue(image);
    fd.append('image', value as Blob, image.name);
    return apiCall<RequestImage>(`/requests/${id}/image`, { method: 'POST', formData: fd });
  },

  async removeImage(id: string): Promise<void> {
    return apiCall<void>(`/requests/${id}/image`, { method: 'DELETE' });
  },
};
