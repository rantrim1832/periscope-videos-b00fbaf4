import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getPropertyProvider } from '@/data/propertyProvider';
import { Building2, Search, PlusCircle, Video, Users, ShieldCheck } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const ManagerStart = () => {
  useDocumentTitle('Manager start — claim or add your property', 'Find, claim, or add a property page and connect official videos/social content.');
  const navigate = useNavigate();
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
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <div className="space-y-4">
            <Badge variant="secondary" className="w-fit">Property staff onboarding</Badge>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">Find your property page. Claim it. Make it look alive.</h1>
            <p className="text-lg text-muted-foreground">
              Connect existing videos, social posts, tours, and official sources. Resident truth stays independent, but your official story should not be empty.
            </p>
            <form onSubmit={search} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input className="pl-10 h-12" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search property name, address, or city" />
              </div>
              <Button type="submit" variant="hero" size="lg">Find</Button>
            </form>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" asChild><Link to="/contribute"><PlusCircle className="w-4 h-4 mr-2" /> Add missing property</Link></Button>
              <Button variant="ghost" asChild><Link to="/feed">Explore first</Link></Button>
            </div>
          </div>

          <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <CardHeader><CardTitle>What claiming unlocks</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex gap-3"><Video className="w-5 h-5 text-primary shrink-0" /><span>Connect Instagram, TikTok, YouTube, website, Matterport, and existing tour content.</span></div>
              <div className="flex gap-3"><Users className="w-5 h-5 text-primary shrink-0" /><span>Invite residents to post video reviews through a property-specific share link.</span></div>
              <div className="flex gap-3"><ShieldCheck className="w-5 h-5 text-primary shrink-0" /><span>Respond and add context without controlling or suppressing resident truth.</span></div>
            </CardContent>
          </Card>
        </section>

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
                        <Button variant="hero" onClick={() => navigate(`/claim/${property.id}`)}>Claim</Button>
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
