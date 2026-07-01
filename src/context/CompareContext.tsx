import { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface CompareItem {
  id: string;
  name: string;
  location: string;
}

interface CompareCtx {
  items: CompareItem[];
  has: (id: string) => boolean;
  toggle: (item: CompareItem) => void;
  remove: (id: string) => void;
  clear: () => void;
  max: number;
}

const MAX = 4;
const KEY = 'pariscope.compare';
const Ctx = createContext<CompareCtx | null>(null);

export const CompareProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CompareItem[]>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as CompareItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* ignore */ }
  }, [items]);

  const has = useCallback((id: string) => items.some((i) => i.id === id), [items]);

  const toggle = useCallback((item: CompareItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev.filter((i) => i.id !== item.id);
      if (prev.length >= MAX) return prev;
      return [...prev, item];
    });
  }, []);

  const remove = useCallback((id: string) => setItems((prev) => prev.filter((i) => i.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  return (
    <Ctx.Provider value={{ items, has, toggle, remove, clear, max: MAX }}>
      {children}
    </Ctx.Provider>
  );
};

export const useCompare = (): CompareCtx => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCompare must be used within CompareProvider');
  return ctx;
};
