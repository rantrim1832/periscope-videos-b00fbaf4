import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { isDemoMode } from '@/lib/demo';
import { useToast } from '@/hooks/use-toast';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface QA { id: string; body: string; created_at: string; answers: { id: string; body: string }[] }

export const PropertyQA = ({ propertyId }: { propertyId: string }) => {
  const { toast } = useToast();
  const [items, setItems] = useState<QA[]>([]);
  const [question, setQuestion] = useState('');
  const [answerFor, setAnswerFor] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [hasSession, setHasSession] = useState(false);

  const load = useCallback(async () => {
    if (isDemoMode()) return;
    const { data } = await (supabase as any)
      .from('property_question')
      .select('id, body, created_at, property_answer(id, body)')
      .eq('canonical_property_id', propertyId)
      .order('created_at', { ascending: false });
    setItems((data ?? []).map((q: any) => ({ ...q, answers: q.property_answer ?? [] })));
  }, [propertyId]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setHasSession(!!session));
    load();
  }, [load]);

  const ask = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await (supabase as any).from('property_question').insert({ canonical_property_id: propertyId, asker_user_id: user.id, body: question });
    if (error) { toast({ title: 'Could not post', description: error.message, variant: 'destructive' }); return; }
    setQuestion(''); toast({ title: 'Question posted' }); load();
  };

  const postAnswer = async (qid: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await (supabase as any).from('property_answer').insert({ question_id: qid, responder_user_id: user.id, body: answer });
    if (error) { toast({ title: 'Could not post', description: error.message, variant: 'destructive' }); return; }
    setAnswer(''); setAnswerFor(null); toast({ title: 'Answer posted' }); load();
  };

  return (
    <section className="container mx-auto px-4 py-10">
      <h2 className="text-2xl font-bold mb-1 flex items-center gap-2"><MessageCircle className="w-6 h-6" /> Questions &amp; answers</h2>
      <p className="text-muted-foreground mb-4">Ask residents anything — parking, pests, deposits, noise.</p>

      {isDemoMode() ? (
        <Card className="p-6 bg-muted/30 border-dashed text-center text-muted-foreground">Q&amp;A is available on the live app.</Card>
      ) : (
        <>
          <Card className="mb-6">
            <CardContent className="p-4 space-y-2">
              {hasSession ? (
                <>
                  <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g. Is parking really $200/mo? How fast is maintenance?" className="min-h-[70px]" />
                  <div className="flex justify-end"><Button onClick={ask} disabled={!question.trim()}>Ask question</Button></div>
                </>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">Sign in to ask a question.</p>
                  <Button variant="hero" size="sm" asChild><Link to="/auth">Sign in</Link></Button>
                </div>
              )}
            </CardContent>
          </Card>

          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No questions yet — be the first to ask.</p>
          ) : (
            <div className="space-y-3">
              {items.map((q) => (
                <Card key={q.id}>
                  <CardContent className="p-4 space-y-2">
                    <p className="font-medium">{q.body}</p>
                    {q.answers.map((a) => (
                      <div key={a.id} className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-3">{a.body}</div>
                    ))}
                    {hasSession && (answerFor === q.id ? (
                      <div className="space-y-2 pt-1">
                        <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Share what you know…" className="min-h-[60px]" />
                        <div className="flex gap-2"><Button size="sm" onClick={() => postAnswer(q.id)} disabled={!answer.trim()}>Post answer</Button><Button size="sm" variant="ghost" onClick={() => setAnswerFor(null)}>Cancel</Button></div>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => { setAnswerFor(q.id); setAnswer(''); }}>Answer</Button>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
};
