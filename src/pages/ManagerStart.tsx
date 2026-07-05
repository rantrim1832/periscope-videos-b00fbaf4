import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getPropertyProvider } from '@/data/propertyProvider';
import { Building2, Search, PlusCircle, Video, Users, ShieldCheck, Bell } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PromptTileRail, type PromptTile } from '@/components/PromptTileRail';
import { Sparkles, Home, Trees, MessageSquare, ClipboardCheck } from 'lucide-react';
import { getContributionTopic } from '@/domain/contributionTopics';

const MANAGER_TILES: PromptTile[] = [
  {
    key: 'leasing-tour',
    title: 'Record your leasing tour',
    hint: 'The single highest-converting video you can post. Walk a renter through as if they just arrived.',
    icon: Sparkles,
    cover: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop',
    to: '/manager?topic=leasing-tour',
    featured: true,
    badge: 'Start here',
  },
  {
    key: 'interior',
    title: 'Interior walkthroughs',
    hint: 'Show a real unit — kitchen, bath, closets, light.',
    icon: Home,
    cover: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&auto=format&fit=crop',
    to: '/manager?topic=interiors',
  },
  {
    key: 'amenities',
    title: 'Show off your amenities',
    hint: 'Pool, gym, lounge, rooftop, coworking, pet spa.',
    icon: Video,
    cover: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&auto=format&fit=crop',
    to: '/manager?topic=amenities',
  },
  {
    key: 'vibe',
    title: 'Capture the neighborhood vibe',
    hint: 'Coffee, transit, parks, nightlife — the 5-minute radius.',
    icon: Trees,
    cover: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&auto=format&fit=crop',
    to: '/manager?topic=area',
  },
  {
    key: 'invite',
    title: 'Invite residents to share their story',
    hint: 'A property-specific link that makes leaving a review painless.',
    icon: MessageSquare,
    cover: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&auto=format&fit=crop',
    to: '/manager',
  },
  {
    key: 'claim',
    title: 'Claim your property',
    hint: 'Verify ownership so you can publish official content.',
    icon: ShieldCheck,
    cover: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop',
    to: '/manager',
  },
  {
    key: 'create',
    title: 'Create a new property page',
    hint: 'Not listed yet? Add your building in under a minute.',
    icon: PlusCircle,
    cover: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop',
    to: '/contribute',
  },
  {
    key: 'alerts',
    title: 'Turn on new-review alerts',
    hint: 'Get notified the moment a resident posts about your building.',
    icon: Bell,
    cover: 'https://images.unsplash.com/photo-1519452575417-564c1401ecc0?w=800&auto=format&fit=crop',
    to: '/manager',
  },
];

const ManagerStart = () => {
  useDocumentTitle('For property managers — claim your page and get discovered', 'Claim your property page, add official videos and content, and get alerts on new resident video reviews.');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const topicKey = searchParams.get('topic');
  const activeTopic = getContributionTopic(topicKey);
  const topicQS = topicKey ? `?topic=${encodeURIComponent(topicKey)}` : '';
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['manager-property-search', query],
    queryFn: () => getPropertyProvider().search(query),
    enabled: query.trim().length > 0,
  });

  const search = (event: FormEvent) => {
    event.preventDefault();
    setQuery(input.trim());
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-5xl space-y-8">
        {activeTopic && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 flex items-start gap-3">
            <Video className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold">Uploading: {activeTopic.label}</p>
              <p className="text-muted-foreground">
                Find your building below — the upload page will open pre-tagged for “{activeTopic.label}”. If your property isn't listed, create it first.
              </p>
            </div>
          </div>
        )}
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <div className="space-y-4">
            <Badge variant="secondary" className="w-fit">For property managers</Badge>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">Claim your page. Add your videos. Get alerted on every new review.</h1>
            <p className="text-lg text-muted-foreground">
              Renters are watching apartment video reviews before they tour. Claim your building, add official videos and tours, and turn on alerts so you never miss a resident review.
            </p>
            <form onSubmit={search} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input className="pl-10 h-12" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your property name to claim or create it" />
              </div>
              <Button type="submit" variant="hero" size="lg">Claim or create</Button>
            </form>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" asChild><Link to="/contribute"><PlusCircle className="w-4 h-4 mr-2" /> Add a brand-new property</Link></Button>
              <Button variant="ghost" asChild><Link to="/feed">Explore first</Link></Button>
            </div>
          </div>

          <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <CardHeader><CardTitle>What claiming unlocks</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex gap-3"><Video className="w-5 h-5 text-primary shrink-0" /><span>Add your official videos, tours, Instagram, TikTok, YouTube, and Matterport to get discovered.</span></div>
              <div className="flex gap-3"><Bell className="w-5 h-5 text-primary shrink-0" /><span>Get alerts the moment a new resident review is posted — respond quickly with context.</span></div>
              <div className="flex gap-3"><Users className="w-5 h-5 text-primary shrink-0" /><span>Invite residents to post video reviews through a property-specific share link.</span></div>
              <div className="flex gap-3"><ShieldCheck className="w-5 h-5 text-primary shrink-0" /><span>Keep your page accurate — reviews stay independent, but your official story is yours.</span></div>
            </CardContent>
          </Card>
        </section>

        <PromptTileRail
          eyebrow="Get discovered"
          title="What to post on your property page"
          subtitle="Renters watch before they tour. Start with the leasing tour, then layer in the rest."
          tiles={MANAGER_TILES}
        />

        {query && (
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Results for "{query}"</h2>
            {isLoading ? <p className="text-muted-foreground">Searching...</p> : results.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center space-y-3">
                  <Building2 className="w-10 h-10 mx-auto text-muted-foreground" />
                  <h3 className="font-semibold">No property found yet</h3>
                  <p className="text-sm text-muted-foreground">Add it now, then come back to claim and connect official content.</p>
                  <Button variant="hero" asChild><Link to="/contribute">Add this property</Link></Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {results.map((property) => (
                  <Card key={property.id} className="hover:border-primary transition-colors">
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{property.name}</h3>
                        <p className="text-sm text-muted-foreground">{[property.addressLine1, property.city, property.state].filter(Boolean).join(', ')}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => navigate(`/property/${property.id}`)}>View</Button>
                        <Button variant="hero" onClick={() => navigate(activeTopic ? `/contribute/${property.id}${topicQS}` : `/claim/${property.id}`)}>
                          {activeTopic ? 'Upload' : 'Claim'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default ManagerStart;
