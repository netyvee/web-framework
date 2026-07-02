import { describe, it, expect } from 'vitest';
import { buildJsonLd } from '../src/seo/schema';
import { page, withSections } from './fixtures';

const origin = 'https://demo.example';

describe('SEO / JSON-LD builder (V0.2 §6)', () => {
  it('builds Organization from page NAP (name/phone E.164/email)', () => {
    const ld = buildJsonLd(page, { origin });
    const org = ld['@graph'].find((n: any) => n['@type'] === 'Organization');
    expect(org.name).toBe(page.nap.trading_name);
    expect(org.telephone).toBe('+44' + page.nap.phone.replace(/\s+/g, '').slice(1));
    expect(org.email).toBe(page.nap.email);
  });

  it('adds LocalBusiness for homepage and Service when schema_type=Service', () => {
    const homeLd = buildJsonLd({ ...page, page_type: 'homepage', seo: { ...page.seo, schema_type: 'Service' } }, { origin });
    const types = homeLd['@graph'].map((n: any) => n['@type']);
    expect(types).toContain('LocalBusiness');
    expect(types).toContain('Service');
  });

  it('adds FAQPage from a faq section and BreadcrumbList from hero breadcrumbs', () => {
    const p = withSections([
      { type: 'hero', fields: { heading: 'H', breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Care', href: '/care' }] } },
      { type: 'faq', fields: { items: [{ q: 'Q1', a: 'A1' }] } },
    ]);
    const ld = buildJsonLd(p, { origin });
    const types = ld['@graph'].map((n: any) => n['@type']);
    expect(types).toContain('FAQPage');
    expect(types).toContain('BreadcrumbList');
    const faq = ld['@graph'].find((n: any) => n['@type'] === 'FAQPage');
    expect(faq.mainEntity[0].name).toBe('Q1');
  });

  it('emits no structured data beyond what the page provides (no foreign literals)', () => {
    const json = JSON.stringify(buildJsonLd(page, { origin }));
    for (const leak of ['vigilservices.co.uk', '020 3098', '020 3973']) expect(json).not.toContain(leak);
  });
});
