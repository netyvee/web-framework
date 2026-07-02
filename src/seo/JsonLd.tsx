// <JsonLd> — renders the PageJson-derived structured data as a script tag. The
// consumer route drops this in once; origin is the site's own domain (site config,
// not a framework literal).
import { buildJsonLd, type JsonLdOptions } from './schema';
import type { PageJson } from '../types';

export function JsonLd({ page, origin, geo }: { page: PageJson } & JsonLdOptions) {
  const data = buildJsonLd(page, { origin, geo });
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe inside a JSON-LD script tag
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
