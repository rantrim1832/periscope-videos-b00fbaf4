import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/* eslint-disable @typescript-eslint/no-explicit-any */

// True if the current user is a verified manager of the given property.
export const useIsManager = (propertyId: string | undefined): boolean => {
  const [isManager, setIsManager] = useState(false);
  useEffect(() => {
    let active = true;
    (async () => {
      if (!propertyId) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (active) setIsManager(false); return; }
      const { data } = await (supabase as any)
        .from('property_manager').select('id')
        .eq('user_id', user.id).eq('canonical_property_id', propertyId).maybeSingle();
      if (active) setIsManager(!!data);
    })();
    return () => { active = false; };
  }, [propertyId]);
  return isManager;
};
