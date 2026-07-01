import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Bell, BellRing } from 'lucide-react';
import { isWatching, toggleWatch, type WatchType } from '@/services/watchService';
import { isDemoMode } from '@/lib/demo';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Props { type: WatchType; id: string; label: string; size?: 'sm' | 'lg' }

// "Follow" a property/city → get notified on new activity. The return loop.
export const WatchButton = ({ type, id, label, size = 'lg' }: Props) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [on, setOn] = useState(false);

  useEffect(() => { if (!isDemoMode()) isWatching(type, id).then(setOn); }, [type, id]);

  const click = async () => {
    if (isDemoMode()) { toast({ title: 'Following is available on the live app' }); return; }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate('/auth'); return; }
    try {
      await toggleWatch(type, id, label, !on);
      setOn(!on);
      toast({ title: !on ? 'Following — we’ll notify you of new activity' : 'Unfollowed' });
    } catch (e) {
      toast({ title: 'Could not update', description: (e as Error).message, variant: 'destructive' });
    }
  };

  return (
    <Button variant={on ? 'secondary' : 'outline'} size={size} onClick={click}>
      {on ? <BellRing className="w-5 h-5 mr-2" /> : <Bell className="w-5 h-5 mr-2" />}
      {on ? 'Following' : 'Follow'}
    </Button>
  );
};
