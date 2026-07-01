import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Building2 } from 'lucide-react';
import type { MediaItem } from '@/domain/property';
import { getVideoProvider } from '@/services/providers/video';
import { VideoPlayer } from './VideoPlayer';

// Immersive, TikTok-style vertical viewer. Resolves the playback URL from the
// video provider (mock plays a real sample stream; Cloudflare/Mux in prod).
export const EvidenceViewer = ({
  item,
  open,
  onOpenChange,
}: {
  item: MediaItem | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) => {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (open && item && !item.embedUrl) {
      const assetId = item.playbackUrl ?? item.id;
      getVideoProvider().getPlayback(assetId).then((p) => {
        if (active) setSrc(p.hlsUrl);
      });
    } else {
      setSrc(null);
    }
    return () => { active = false; };
  }, [open, item]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-black border-0">
        <DialogTitle className="sr-only">{item?.title ?? 'Video'}</DialogTitle>
        <div className="relative aspect-[9/16] bg-black">
          {item?.embedUrl ? (
            <iframe
              src={item.embedUrl}
              title={item.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            src && <VideoPlayer src={src} className="w-full h-full object-contain bg-black" />
          )}
          <div className="absolute top-3 left-3">
            {item?.source === 'official'
              ? <Badge variant="secondary" className="gap-1"><Building2 className="w-3 h-3" /> Official</Badge>
              : <Badge variant="success" className="gap-1"><ShieldCheck className="w-3 h-3" /> Resident</Badge>}
          </div>
        </div>
        {item && (
          <div className="p-4 bg-background">
            <p className="font-medium">{item.title}</p>
            {item.city && <p className="text-sm text-muted-foreground">{item.city}</p>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
