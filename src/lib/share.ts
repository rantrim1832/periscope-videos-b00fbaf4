// Reusable share helper — native share sheet where available, clipboard fallback.
export async function shareContent(opts: { title: string; text: string; url?: string }): Promise<'shared' | 'copied' | 'cancelled'> {
  const url = opts.url ?? window.location.href;
  try {
    if (navigator.share) {
      await navigator.share({ title: opts.title, text: opts.text, url });
      return 'shared';
    }
    await navigator.clipboard.writeText(`${opts.text} ${url}`);
    return 'copied';
  } catch {
    return 'cancelled';
  }
}
