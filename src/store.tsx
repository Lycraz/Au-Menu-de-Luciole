import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { DEFAULT_STATE, type AppState } from './logic';

const KEY = 'au-menu-v1';

type Store = {
  S: AppState;
  ready: boolean;
  set: (patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) => void;
  toast: (msg: string) => void;
  toastMsg: string | null;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [S, setS] = useState<AppState>(DEFAULT_STATE);
  const [ready, setReady] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setS({ ...DEFAULT_STATE, ...JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(S)).catch(() => {});
  }, [S, ready]);

  const set = useCallback<Store['set']>((patch) => {
    setS((s) => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) }));
  }, []);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToastMsg(null), 1800);
  }, []);

  return <Ctx.Provider value={{ S, ready, set, toast, toastMsg }}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore hors de StoreProvider');
  return s;
}
