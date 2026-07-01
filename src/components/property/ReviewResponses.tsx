import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Management responses to a review. Managers can ADD context; the safety rule
// (enforced in RLS) means they can never edit or delete the review itself.
export const ReviewResponses = ({ reviewId, canRespond }: { reviewId: string; canRespond: boolean }) => {
  const { toast } = useToast();
  const [responses, setResponses] = useState<any[]>([]);
  const [body, setBody] = useState('');
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    const { data } = await (supabase as any)
      .from('review_response').select('*').eq('review_id', reviewId).order('created_at', { ascending: true });
    setResponses(data ?? []);
  }, [reviewId]);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await (supabase as any).from('review_response').insert({
      review_id: reviewId, responder_user_id: user.id, body,
    });
    if (error) { toast({ title: 'Could not post response', description: error.message, variant: 'destructive' }); return; }
    setBody(''); setOpen(false); toast({ title: 'Response posted' }); load();
  };

  if (responses.length === 0 && !canRespond) return null;

  return (
    <div className="mt-3 space-y-2 border-l-2 border-primary/30 pl-3">
      {responses.map((r) => (
        <div key={r.id} className="text-sm">
          <Badge variant="secondary" className="gap-1 mb-1"><Building2 className="w-3 h-3" /> Management response</Badge>
          <p className="text-muted-foreground">{r.body}</p>
        </div>
      ))}
      {canRespond && (
        open ? (
          <div className="space-y-2">
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Add official context (you cannot edit or remove the review)…" className="min-h-[80px]" />
            <div className="flex gap-2">
              <Button size="sm" onClick={submit} disabled={!body.trim()}>Post response</Button>
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}><Building2 className="w-4 h-4 mr-1" /> Respond as management</Button>
        )
      )}
    </div>
  );
};
