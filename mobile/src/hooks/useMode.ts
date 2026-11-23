import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const KEY = 'catai-mode';

export type AppMode = 'dono' | 'catador';

export interface UseModeResult {
  mode: AppMode | null;
  loading: boolean;
  setMode: (m: AppMode) => Promise<void>;
  clearMode: () => Promise<void>;
}

export function useMode(): UseModeResult {
  const [mode, setLocalMode] = useState<AppMode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (v === 'dono' || v === 'catador') setLocalMode(v);
      })
      .finally(() => setLoading(false));
  }, []);

  const setMode = useCallback(async (m: AppMode) => {
    await AsyncStorage.setItem(KEY, m);
    setLocalMode(m);
  }, []);

  const clearMode = useCallback(async () => {
    await AsyncStorage.removeItem(KEY);
    setLocalMode(null);
  }, []);

  return { mode, loading, setMode, clearMode };
}
