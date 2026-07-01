import { useEffect } from 'react';

// Sets the document title (and optional meta description) per page for SEO and
// shareability. Restores nothing on unmount (next page sets its own).
export function useDocumentTitle(title: string, description?: string) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      let el = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', 'description');
        document.head.appendChild(el);
      }
      el.setAttribute('content', description);
    }
  }, [title, description]);
}
