import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, Instagram, Facebook, Youtube, Box, Images, ShieldCheck, Building2, Plug } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PropertyView, OfficialChannel, ChannelKind } from '@/domain/property';
import { useIsManager } from '@/hooks/useIsManager';
import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const ICON: Record<ChannelKind, typeof Globe> = {
  website: Globe, instagram: Instagram, facebook: Facebook, tiktok: Youtube,
  youtube: Youtube, matterport: Box, gallery: Images,
};
const KIND_LABEL: Record<ChannelKind, string> = {
  website: 'Website', instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok',
  youtube: 'YouTube', matterport: '3D tour', gallery: 'Photos',
};

function youtubeEmbed(url: string): string | null {
  const watch = url.match(/[?&]v=([^&]+)/)?.[1];
  const short = url.match(/youtu\.be\/([^?]+)/)?.[1];
  const id = watch ?? short;
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

function isInstagramPost(url: string): boolean {
  return /instagram\.com\/(p|reel|tv)\//i.test(url);
}

function isApartmentsVideo(url: string): boolean {
  return /vapi\.apartments\.com\/video\/play/i.test(url);
}

// Official content from the property's own channels. Labeled by trust:
// "Official · Public" (embedded/linked from their public channels, pre-claim)
// vs "Official · Verified" (post-claim, operator-managed). Never implies
// endorsement until verified.
export const OfficialContent = ({ property }: { property: PropertyView }) => {
  const [selectedImage, setSelectedImage] = useState<OfficialChannel | null>(null);
  const channels = property.officialChannels ?? [];
  const verified = channels.some((c) => c.verified);
  const gallery = channels.filter((c) => c.kind === 'gallery' && /\.(jpg|jpeg|png|webp)(\?|$)/i.test(c.url)).slice(0, 12);
  const tours = channels.filter((c) => c.kind === 'matterport' || /matterport\.com|panoskin\.com/i.test(c.url) || isApartmentsVideo(c.url)).slice(0, 6);
  const youtube = channels.filter((c) => c.kind === 'youtube' && youtubeEmbed(c.url)).slice(0, 2);
  const instagramPosts = channels.filter((c) => c.kind === 'instagram' && isInstagramPost(c.url)).slice(0, 8);
  const profiles = channels.filter((c) =>
    !gallery.includes(c) &&
    !tours.includes(c) &&
    !youtube.includes(c) &&
    !instagramPosts.includes(c) &&
    !c.embedUrl,
  ).slice(0, 16);
  const isManager = useIsManager(property.id);

  return (
    <section className="container mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-1">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Building2 className="w-6 h-6" /> Official content</h2>
        {channels.length > 0 && (
          <Badge variant={verified ? 'success' : 'secondary'} className="gap-1">
            <ShieldCheck className="w-3 h-3" /> {verified ? 'Official · Verified' : 'Official · Public'}
          </Badge>
        )}
        {isManager && (
          <Button variant="outline" size="sm" asChild className="ml-auto">
            <Link to={`/manage/${property.id}`}><Plug className="w-4 h-4 mr-1" /> Connect sources</Link>
          </Button>
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
          {(gallery.length > 0 || tours.length > 0 || youtube.length > 0 || instagramPosts.length > 0) && (
            <div className="grid gap-4">
              {gallery.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {gallery.map((c) => (
                    <button key={c.id} type="button" onClick={() => setSelectedImage(c)} className="group relative overflow-hidden rounded-lg border bg-muted aspect-[4/3] text-left">
                      <img src={c.url} alt={c.label ?? `${property.name} official photo`} className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                      <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">Official photo · tap to view</span>
                    </button>
                  ))}
                </div>
              )}

              {(tours.length > 0 || youtube.length > 0) && (
                <div className="grid sm:grid-cols-2 gap-4">
                  {tours.map((c) => (
                    <Card key={c.id} className="overflow-hidden">
                      <iframe title={c.label ?? 'Official tour'} src={c.url} className="w-full h-64 border-0" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen loading="lazy" />
                      <CardContent className="p-3"><p className="text-sm font-medium">{isApartmentsVideo(c.url) ? 'Official video tour' : 'Official 3D / virtual tour'}</p></CardContent>
                    </Card>
                  ))}
                  {youtube.map((c) => (
                    <Card key={c.id} className="overflow-hidden">
                      <iframe title={c.label ?? 'Official YouTube'} src={youtubeEmbed(c.url) ?? c.url} className="w-full h-64 border-0" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen loading="lazy" />
                      <CardContent className="p-3"><p className="text-sm font-medium">Official YouTube</p></CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {instagramPosts.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Recent official Instagram posts</CardTitle></CardHeader>
                  <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {instagramPosts.map((c) => (
                      <a key={c.id} href={c.url} target="_blank" rel="noopener noreferrer nofollow" className="rounded-lg border p-3 hover:border-primary transition-colors">
                        <Instagram className="w-5 h-5 text-primary mb-2" />
                        <p className="text-sm font-medium line-clamp-3">{c.label?.replace(/^Instagram post · /, '') || 'Instagram post'}</p>
                        <p className="text-xs text-muted-foreground mt-2">Open on Instagram</p>
                      </a>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {channels.filter((c) => c.embedUrl).length > 0 && (
            <div className="grid sm:grid-cols-2 gap-4">
              {channels.filter((c) => c.embedUrl).map((c) => (
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
              {profiles.map((c: OfficialChannel) => {
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
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-5xl p-2 bg-black border-0">
          {selectedImage && (
            <img src={selectedImage.url} alt={selectedImage.label ?? `${property.name} official photo`} className="max-h-[85vh] w-full object-contain rounded" />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};
