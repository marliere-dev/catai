import { User } from 'firebase/auth';
import { useEffect, useState } from 'react';

import { subscribeAuth } from '@/api/auth';

export interface UseAuthResult {
  user: User | null;
  loading: boolean;
}

export function useAuth(): UseAuthResult {
  const [state, setState] = useState<UseAuthResult>({ user: null, loading: true });

  useEffect(() => {
    let unsub: (() => void) | undefined;
    try {
      unsub = subscribeAuth((u) => {
        setState({ user: u, loading: false });
      });
    } catch (err) {
      // Firebase not configured. Surface as "not loading, no user" so the UI
      // can prompt for env vars instead of spinning forever.
      // eslint-disable-next-line no-console
      console.warn('[catai] auth subscription failed:', (err as Error).message);
      setState({ user: null, loading: false });
    }
    return () => unsub?.();
  }, []);

  return state;
}
