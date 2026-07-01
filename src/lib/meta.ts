// Best-effort document meta for social sharing. Sets title + OG/Twitter tags,
// pointing og:image at the dynamic og-image edge function.
//
// NOTE: for crawlers that don't execute JS (most link unfurlers), these tags
// must be present in the initial HTML — that requires prerendering/SSR or a
// bot-detecting edge route. This helper covers JS-aware consumers and in-app
// state; server-side injection is the documented production follow-up.

import { getEnv } from '@/services/env';

function upsertMeta(attr: 'property' | 'name', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function ogImageUrl(propertyId: string): string {
  const base = getEnv('VITE_SUPABASE_URL') ?? '';
  return `${base}/functions/v1/og-image?propertyId=${encodeURIComponent(propertyId)}`;
}

export function setPropertyMeta(opts: {
  propertyId: string;
  name: string;
  location: string;
  score: number | null;
}) {
  const title = `${opts.name} — Truth Score${opts.score != null ? ` ${opts.score}/100` : ''} | Pariscope`;
  const description = `See verified resident reviews, video proof, and the Truth Score for ${opts.name}${opts.location ? `, ${opts.location}` : ''} before you sign.`;
  const image = ogImageUrl(opts.propertyId);

  document.title = title;
  upsertMeta('name', 'description', description);
  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:description', description);
  upsertMeta('property', 'og:image', image);
  upsertMeta('property', 'og:type', 'website');
  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', title);
  upsertMeta('name', 'twitter:image', image);
}
