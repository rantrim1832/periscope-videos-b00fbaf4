import { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface SavedItem { id: string; name: string; location: string }

interface SavedCtx {
  items: SavedItem[];
  has: (id: string) => boolean;
  toggle: (item: SavedItem) => void;
  remove: (id: string) => void;
}

const KEY = 'pariscope.saved';
const Ctx = createContext<SavedCtx | null>(null);

// Local, zero-friction "save for later" (works signed-out / in demo). A DB-backed
// sync can layer on later for cross-device saves.
export const SavedProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<SavedItem[]>(() => {
    try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* ignore */ } }, [items]);

  const has = useCallback((id: string) => items.some((i) => i.id === id), [items]);
  const toggle = useCallback((item: SavedItem) => {
    setItems((prev) => prev.some((i) => i.id === item.id) ? prev.filter((i) => i.id !== item.id) : [...prev, item]);
  }, []);
  const remove = useCallback((id: string) => setItems((prev) => prev.filter((i) => i.id !== id)), []);

  return <Ctx.Provider value={{ items, has, toggle, remove }}>{children}</Ctx.Provider>;
};

export const useSaved = (): SavedCtx => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSaved must be used within SavedProvider');
  return ctx;
};
