import { Twitter, Facebook, Linkedin, MessageCircle, Link2, Share2 } from 'lucide-react';
import { useState } from 'react';
import { shareContent } from '@/lib/share';
import { useToast } from '@/hooks/use-toast';

// Viral distribution row. Each icon opens the platform's web share
// intent, or falls back to native share sheet + clipboard copy.
const URL = typeof window !== 'undefined' ? window.location.origin : 'https://joinperiscope.com';
const TEXT = 'Real apartment video reviews from actual residents. See what your building is really like before you sign the lease.';

const LINKS = [
  { label: 'X / Twitter', Icon: Twitter, href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(URL)}&text=${encodeURIComponent(TEXT)}` },
  { label: 'Facebook', Icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(URL)}` },
  { label: 'LinkedIn', Icon: Linkedin, href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(URL)}` },
  { label: 'Reddit', Icon: MessageCircle, href: `https://www.reddit.com/submit?url=${encodeURIComponent(URL)}&title=${encodeURIComponent(TEXT)}` },
  { label: 'WhatsApp', Icon: MessageCircle, href: `https://wa.me/?text=${encodeURIComponent(TEXT + ' ' + URL)}` },
];

export const ShareRow = ({ variant = 'dark' }: { variant?: 'dark' | 'light' }) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const base = variant === 'dark'
    ? 'bg-white/5 hover:bg-white/15 text-white border-white/10 hover:border-white/30'
    : 'bg-card hover:bg-muted text-foreground border-border/60 hover:border-primary/40';

  const share = async () => {
    const r = await shareContent({ title: 'Periscope', text: TEXT, url: URL });
    if (r === 'copied') { setCopied(true); toast({ title: 'Link copied' }); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
      <button
        onClick={share}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all ${base}`}
      >
        <Share2 className="h-4 w-4" /> {copied ? 'Copied!' : 'Share Periscope'}
      </button>
      {LINKS.map(({ label, Icon, href }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${label}`}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all hover:-translate-y-0.5 ${base}`}
        >
          <Icon className="h-4 w-4" />
        </a>
      ))}
      <button
        onClick={async () => { await navigator.clipboard.writeText(URL); setCopied(true); toast({ title: 'Link copied' }); setTimeout(() => setCopied(false), 2000); }}
        aria-label="Copy link"
        className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all hover:-translate-y-0.5 ${base}`}
      >
        <Link2 className="h-4 w-4" />
      </button>
    </div>
  );
};