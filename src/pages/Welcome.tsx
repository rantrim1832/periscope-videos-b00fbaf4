import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Search, PenLine, Building2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

/* eslint-disable @typescript-eslint/no-explicit-any */

const OPTIONS = [
  { intent: 'renter', icon: Search, title: "I'm apartment hunting", desc: 'Look up buildings, watch real reviews, compare.', to: '/feed' },
  { intent: 'resident', icon: PenLine, title: 'I live (or lived) somewhere', desc: 'Share the truth — text or a quick video.', to: '/contribute' },
  { intent: 'manager', icon: Building2, title: 'I manage a property', desc: 'Claim your community and add official content.', to: '/browse' },
  { intent: 'creator', icon: Sparkles, title: "I'm a creator / investigator", desc: 'Build an audience around apartment truth.', to: '/feed' },
] as const;

const Welcome = () => {
  const navigate = useNavigate();

  const choose = async (intent: string, to: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await (supabase as any).from('resident_profile').update({ intent }).eq('id', user.id);
    } catch { /* demo mode / not signed in — routing still works */ }
    navigate(to);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome to Pariscope</h1>
          <p className="text-muted-foreground">What brings you here? We'll take you to the right place.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {OPTIONS.map((o) => {
            const Icon = o.icon;
            return (
              <Card key={o.intent} onClick={() => choose(o.intent, o.to)} className="cursor-pointer hover:border-primary hover:shadow-lg transition-all">
                <CardContent className="p-6 space-y-2">
                  <Icon className="w-8 h-8 text-primary" />
                  <h2 className="font-semibold text-lg">{o.title}</h2>
                  <p className="text-sm text-muted-foreground">{o.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-8">
          You can do all of these anytime — this just personalizes your start.
        </p>
      </div>
    </div>
  );
};

export default Welcome;
