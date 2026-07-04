import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, Building2, Users, Search } from 'lucide-react';
import type { PropertyView } from '@/domain/property';
import { suggestContent, type StoryAudience } from '@/domain/story';
import { useIsManager } from '@/hooks/useIsManager';

// Missing-content prompts, grouped by audience: residents, management, creators.
export const ContentSuggestions = ({ property }: { property: PropertyView }) => {
  const navigate = useNavigate();
  const isManager = useIsManager(property.id);
  const [audience, setAudience] = useState<StoryAudience>(isManager ? 'management' : 'resident');
  const suggestions = suggestContent(property, audience);

  const tabs: { key: StoryAudience; label: string; icon: typeof Video }[] = [
    { key: 'resident', label: 'Residents', icon: Users },
    { key: 'management', label: 'Management', icon: Building2 },
    { key: 'creator', label: 'Creators', icon: Search },
  ];

  return (
    <section className="container mx-auto px-4 py-10">
      <h2 className="text-2xl font-bold mb-1">What's missing</h2>
      <p className="text-muted-foreground mb-4">Content that hasn't been added yet.</p>

      <div className="flex gap-2 mb-4">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <Button key={t.key} size="sm" variant={audience === t.key ? 'default' : 'outline'} onClick={() => setAudience(t.key)}>
              <Icon className="w-4 h-4 mr-1" /> {t.label}
            </Button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {suggestions.map((s) => (
          <Card key={s.label} className="hover:border-primary transition-colors">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <span className="text-sm font-medium">{s.label}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate(audience === 'management' && !isManager ? `/claim/${property.id}` : `/contribute/${property.id}`)}
              >
                <Video className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {audience === 'management' && !isManager && (
        <p className="text-xs text-muted-foreground mt-3">
          Management content requires a verified claim. <span className="underline cursor-pointer" onClick={() => navigate(`/claim/${property.id}`)}>Claim this property</span> to contribute official content.
        </p>
      )}
    </section>
  );
};
