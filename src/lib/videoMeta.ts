// Because production schema is owned externally and we can't add columns
// yet, AI-generated video metadata is stashed as prefixed entries in the
// existing `hashtags text[]` column. This module owns the read/write
// contract so the whole app stays consistent.
//
// Prefixes:
//   summary:<text>     — 2-3 sentence AI summary (single entry)
//   tag:<slug>         — one entry per AI-generated angle/topic tag
//   angle:<text>       — one-line editorial angle (single entry)
//   editor_note:<text> — admin-written note (single entry)
//   yt:<id> ch:<name> cat:<slug> src:<url> q:<query>  — existing prefixes
//
// Once Cursor adds real columns (`ai_summary`, `ai_tags`, `editor_note`),
// this module is the single place we swap the source of truth.

export type VideoMeta = {
  summary: string | null;
  tags: string[];
  angle: string | null;
  editorNote: string | null;
  channel: string | null;
  youtubeId: string | null;
  category: string | null;
  sourceUrl: string | null;
};

export function parseVideoMeta(hashtags: string[] | null | undefined, caption?: string | null): VideoMeta {
  const list = Array.isArray(hashtags) ? hashtags : [];
  const findOne = (prefix: string): string | null => {
    const hit = list.find((t) => typeof t === 'string' && t.startsWith(prefix));
    return hit ? hit.slice(prefix.length) : null;
  };
  const findAll = (prefix: string): string[] =>
    list.filter((t) => typeof t === 'string' && t.startsWith(prefix)).map((t) => t.slice(prefix.length));

  const channel = findOne('ch:') ?? caption?.split('·')[0]?.trim() ?? null;
  return {
    summary: findOne('summary:'),
    tags: findAll('tag:'),
    angle: findOne('angle:'),
    editorNote: findOne('editor_note:'),
    channel,
    youtubeId: findOne('yt:'),
    category: findOne('cat:'),
    sourceUrl: findOne('src:'),
  };
}

/**
 * Return a new hashtags array with the given AI meta merged in, stripping
 * any prior summary/tag/angle entries so calls are idempotent. Preserves
 * all other prefixes (yt:, ch:, cat:, q:, src:, editor_note:, etc.).
 */
export function withAiMeta(
  hashtags: string[] | null | undefined,
  ai: { summary?: string | null; tags?: string[]; angle?: string | null }
): string[] {
  const keep = (Array.isArray(hashtags) ? hashtags : []).filter((t) => {
    if (typeof t !== 'string') return false;
    return !t.startsWith('summary:') && !t.startsWith('tag:') && !t.startsWith('angle:');
  });
  const next = [...keep];
  if (ai.summary) next.push(`summary:${ai.summary}`);
  if (ai.angle) next.push(`angle:${ai.angle}`);
  for (const tag of ai.tags ?? []) {
    const clean = String(tag).trim().slice(0, 40);
    if (clean) next.push(`tag:${clean}`);
  }
  return next;
}

export function withEditorNote(hashtags: string[] | null | undefined, note: string | null): string[] {
  const keep = (Array.isArray(hashtags) ? hashtags : []).filter(
    (t) => typeof t === 'string' && !t.startsWith('editor_note:')
  );
  if (note && note.trim()) keep.push(`editor_note:${note.trim().slice(0, 500)}`);
  return keep;
}

export function youtubeUrlFor(id: string | null | undefined): string | null {
  return id ? `https://www.youtube.com/watch?v=${id}` : null;
}

export function youtubeChannelUrl(channel: string | null | undefined): string | null {
  if (!channel) return null;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(channel)}`;
}