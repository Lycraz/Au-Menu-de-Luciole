import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { setUserData } from './catalog';
import type { Ingredient, Recipe } from './data';
import { DEFAULT_STATE, type AppState } from './logic';

const KEY = 'au-menu-v1';

type Store = {
  S: AppState;
  ready: boolean;
  set: (patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) => void;
  toast: (msg: string) => void;
  toastMsg: string | null;
  saveRecipe: (r: Recipe, newIng: Record<string, Ingredient>) => void;
  deleteRecipe: (id: string) => void;
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
        if (!raw) return;
        const saved = JSON.parse(raw);
        setS({ ...DEFAULT_STATE, ...saved, drive: { ...DEFAULT_STATE.drive, ...(saved.drive || {}) } });
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

  const saveRecipe = useCallback<Store['saveRecipe']>((r, newIng) => {
    setS((s) => {
      const exists = s.myRecipes.some((x) => x.id === r.id);
      return {
        ...s,
        myIng: { ...s.myIng, ...newIng },
        myRecipes: exists ? s.myRecipes.map((x) => (x.id === r.id ? r : x)) : [r, ...s.myRecipes],
      };
    });
  }, []);

  const deleteRecipe = useCallback((id: string) => {
    setS((s) => ({
      ...s,
      myRecipes: s.myRecipes.filter((x) => x.id !== id),
      plan: Object.fromEntries(Object.entries(s.plan).filter(([, v]) => v !== id)),
    }));
  }, []);

  // Rend les recettes perso visibles par la logique (planning, listes, fraîcheur) avant le rendu des écrans.
  setUserData(S.myRecipes, S.myIng);

  return <Ctx.Provider value={{ S, ready, set, toast, toastMsg, saveRecipe, deleteRecipe }}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore hors de StoreProvider');
  return s;
}
