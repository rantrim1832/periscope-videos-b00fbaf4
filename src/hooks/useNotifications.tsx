import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface AppNotification {
  id: string;
  type: string;
  message: string;
  review_id: string | null;
  property_id: string | null;
  is_read: boolean;
  created_at: string;
}

export const useNotifications = () => {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setItems([]); setLoading(false); return; }
    const { data } = await (supabase as any)
      .from('notification').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(50);
    setItems(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const unread = items.filter((n) => !n.is_read).length;

  const markAllRead = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await (supabase as any).from('notification').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }, []);

  return { items, unread, loading, reload: load, markAllRead };
};
