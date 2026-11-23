import { MeUser } from '@/types/api';

import { apiCall } from './client';

export const meApi = {
  async fetch(): Promise<MeUser> {
    return apiCall<MeUser>('/me');
  },

  async updateName(name: string): Promise<MeUser> {
    return apiCall<MeUser>('/me', { method: 'PATCH', body: { name } });
  },
};
