// Extracted verbatim from netyvee/care app/[[...slug]]/page.tsx generateMetadata
// body (identical in netyvee/staffing) — F1.2. The consumer route delegates here.
import type { Metadata } from 'next';
import type { PageJson } from './types';

export function buildPageMetadata(page: PageJson | null): Metadata {
  if (!page) return {};
  const canonical = page.seo.canonical.replace(/\/$/, '') || '/';
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
      images: page.seo.og_image ? [{ url: page.seo.og_image }] : [],
    },
  };
}
