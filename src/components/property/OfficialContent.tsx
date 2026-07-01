import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, Instagram, Facebook, Youtube, Box, Images, ShieldCheck, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PropertyView, OfficialChannel, ChannelKind } from '@/domain/property';

const ICON: Record<ChannelKind, typeof Globe> = {
  website: Globe, instagram: Instagram, facebook: Facebook, tiktok: Youtube,
  youtube: Youtube, matterport: Box, gallery: Images,
};
const KIND_LABEL: Record<ChannelKind, string> = {
  website: 'Website', instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok',
  youtube: 'YouTube', matterport: '3D tour', gallery: 'Photos',
};

// Official content from the property's own channels. Labeled by trust:
// "Official · Public" (embedded/linked from their public channels, pre-claim)
// vs "Official · Verified" (post-claim, operator-managed). Never implies
// endorsement until verified.
export const OfficialContent = ({ property }: { property: PropertyView }) => {
  const channels = property.officialChannels ?? [];
  const verified = channels.some((c) => c.verified);
  const embeds = channels.filter((c) => c.embedUrl);

  return (
    <section className="container mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-1">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Building2 className="w-6 h-6" /> Official content</h2>
        {channels.length > 0 && (
          <Badge variant={verified ? 'success' : 'secondary'} className="gap-1">
            <ShieldCheck className="w-3 h-3" /> {verified ? 'Official · Verified' : 'Official · Public'}
          </Badge>
        )}
      </div>
      <p className="text-muted-foreground mb-4">
        Resident truth + official context = the complete picture. {verified ? 'Managed by the verified operator.' : 'From the property’s public channels (unverified).'}
      </p>

      {channels.length === 0 ? (
        <Card className="p-6 bg-muted/30 border-dashed flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-muted-foreground">No official content yet.</p>
          <Button variant="outline" asChild><Link to={`/claim/${property.id}`}>Own this property? Claim it to add official content</Link></Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {embeds.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-4">
              {embeds.map((c) => (
                <Card key={c.id} className="overflow-hidden">
                  <iframe title={c.label ?? KIND_LABEL[c.kind]} src={c.embedUrl} className="w-full h-64 border-0" allowFullScreen loading="lazy" />
                  <CardContent className="p-3"><p className="text-sm font-medium">{c.label ?? KIND_LABEL[c.kind]}</p></CardContent>
                </Card>
              ))}
            </div>
          )}
          <Card>
            <CardHeader><CardTitle className="text-base">Official channels</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {channels.filter((c) => !c.embedUrl).map((c: OfficialChannel) => {
                const Icon = ICON[c.kind];
                return (
                  <Button key={c.id} variant="outline" size="sm" asChild>
                    <a href={c.url} target="_blank" rel="noopener noreferrer nofollow">
                      <Icon className="w-4 h-4 mr-2" /> {c.label ?? KIND_LABEL[c.kind]}
                    </a>
                  </Button>
                );
              })}
            </CardContent>
          </Card>
          {!verified && (
            <p className="text-xs text-muted-foreground">
              Linked/embedded from public sources with attribution — we don’t re-host. Are you the operator?{' '}
              <Link to={`/claim/${property.id}`} className="underline">Claim this property</Link> to verify and manage it.
            </p>
          )}
        </div>
      )}
    </section>
  );
};
