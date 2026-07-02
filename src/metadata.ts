// Extracted verbatim from netyvee/care app/[[...slug]]/page.tsx generateMetadata
// body (identical in netyvee/staffing) — F1.2. The consumer route delegates here.
import type { Metadata } from 'next';
import type { PageJson } from './types';

// opts.ogImage = a site DEFAULT Open Graph image used when a page has no seo.og_image
// (so every page emits a deterministic og:image — the §2 visual-completion gate).
export function buildPageMetadata(page: PageJson | null, opts: { ogImage?: string } = {}): Metadata {
  if (!page) return {};
  const canonical = page.seo.canonical.replace(/\/$/, '') || '/';
  const og = page.seo.og_image ?? opts.ogImage;
  return {
    title: page.seo.title,
    description: page.seo.description,
    alternates: { canonical },
    robots: page.seo.noindex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title: page.seo.title,
      description: page.seo.description,
      url: canonical,
      siteName: page.nap.trading_name,
      locale: 'en_GB',
      type: 'website',
      images: og ? [{ url: og }] : [],
    },
  };
}
