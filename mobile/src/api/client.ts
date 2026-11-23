import Constants from 'expo-constants';

import { ApiError } from '@/types/api';

import { getCurrentIdToken } from './auth';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra as { apiUrl?: string })?.apiUrl ??
  '';

if (!API_URL && process.env.NODE_ENV !== 'test') {
  // eslint-disable-next-line no-console
  console.warn(
    '[catai] EXPO_PUBLIC_API_URL is not set. Configure it in mobile/.env so the app can reach the backend.',
  );
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  formData?: FormData;
  query?: Record<string, string | number | undefined>;
}

export class CataiApiError extends Error {
  status: number;
  field?: string;

  constructor(message: string, status: number, field?: string) {
    super(message);
    this.name = 'CataiApiError';
    this.status = status;
    this.field = field;
  }
}

export async function apiCall<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  if (!API_URL) {
    throw new CataiApiError('Backend URL not configured (EXPO_PUBLIC_API_URL)', 0);
  }
  const token = await getCurrentIdToken();
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  let body: BodyInit | undefined;
  if (opts.formData) {
    body = opts.formData as unknown as BodyInit;
    // fetch sets Content-Type for FormData automatically
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }

  const url = new URL(path.startsWith('http') ? path : `${API_URL}${path}`);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: opts.method ?? 'GET',
      headers,
      body,
    });
  } catch (err) {
    throw new CataiApiError(
      `Network error: ${(err as Error).message}. Check EXPO_PUBLIC_API_URL.`,
      0,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // empty body or non-json
  }

  if (!response.ok) {
    const apiErr = payload as ApiError | null;
    throw new CataiApiError(
      apiErr?.error ?? `Request failed (${response.status})`,
      response.status,
      apiErr?.field,
    );
  }

  return payload as T;
}
