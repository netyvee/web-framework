// @vigil/web-framework — SEO / JSON-LD builder (v0.2, §6). Ports the reusable
// structured-data strength of the Cleaning site (Organization / LocalBusiness /
// Service / FAQPage / BreadcrumbList) into the framework, driven ENTIRELY by
// PageJson — zero site literals (name/phone/email/url all come from page.nap +
// origin). Raises every consuming site's SEO; closes Care's missing-JSON-LD gap.

import type { PageJson } from '../types';

// Estate market geo (all four divisions serve London). Not a division identity
// literal; overridable per call.
const GEO = { region: 'London', country: 'GB' } as const;

function toE164(phone: string): string {
  const compact = phone.replace(/\s+/g, '');
  return compact.startsWith('+') ? compact : compact.replace(/^0/, '+44');
}

function absCanonical(origin: string, canonical: string): string {
  if (/^https?:\/\//i.test(canonical)) return canonical.replace(/\/$/, '') || canonical;
  const path = canonical.replace(/\/$/, '');
  return `${origin}${path || ''}` || origin;
}

export type JsonLdOptions = { origin: string; geo?: { region: string; country: string } };

export function buildJsonLd(page: PageJson, opts: JsonLdOptions): Record<string, any> {
  const geo = opts.geo ?? GEO;
  const origin = opts.origin.replace(/\/$/, '');
  const url = absCanonical(origin, page.seo.canonical);
  const graph: any[] = [];

  const org: any = {
    '@type': 'Organization',
    '@id': `${origin}/#org`,
    name: page.nap.trading_name,
    url: origin,
    telephone: toE164(page.nap.phone),
    areaServed: { '@type': 'City', name: geo.region },
  };
  if (page.nap.email) org.email = page.nap.email;
  if (page.nap.address) {
    org.address = { '@type': 'PostalAddress', streetAddress: page.nap.address, addressRegion: geo.region, addressCountry: geo.country };
  }
  graph.push(org);

  // LocalBusiness for public-facing archetypes
  if (['homepage', 'service', 'borough'].includes(page.page_type)) {
    graph.push({
      '@type': 'LocalBusiness',
      '@id': `${origin}/#business`,
      name: page.nap.trading_name,
      url: origin,
      telephone: toE164(page.nap.phone),
      ...(page.nap.address ? { address: { '@type': 'PostalAddress', streetAddress: page.nap.address, addressRegion: geo.region, addressCountry: geo.country } } : {}),
      areaServed: { '@type': 'City', name: geo.region },
    });
  }

  // Service when declared
  if (page.seo.schema_type === 'Service') {
    graph.push({
      '@type': 'Service',
      name: page.seo.title,
      description: page.seo.description,
      areaServed: { '@type': 'City', name: geo.region },
      provider: { '@id': `${origin}/#org` },
      url,
    });
  }

  // FAQPage from a faq section, if present
  const faq = page.sections.find((s) => s.type === 'faq');
  const faqItems: any[] = (faq?.fields?.items ?? []).filter((it: any) => it?.q && it?.a);
  if (faqItems.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faqItems.map((it: any) => ({
        '@type': 'Question',
        name: it.q,
        acceptedAnswer: { '@type': 'Answer', text: it.a },
      })),
    });
  }

  // BreadcrumbList from a hero's breadcrumbs, if present
  const hero = page.sections.find((s) => s.type === 'hero');
  const crumbs: any[] = Array.isArray(hero?.fields?.breadcrumbs) ? hero!.fields.breadcrumbs : [];
  if (crumbs.length > 0) {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((c: any, i: number) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: c.label,
        item: /^https?:/i.test(c.href) ? c.href : `${origin}${c.href}`,
      })),
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}
