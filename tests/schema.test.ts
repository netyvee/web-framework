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

  // ── SEO-04 items 3/5 (additive) ────────────────────────────────────────────
  it('adds an Article node ONLY when schema_type===Article (item 3)', () => {
    const noArticle = buildJsonLd(page, { origin })['@graph'].map((n: any) => n['@type']);
    expect(noArticle).not.toContain('Article');

    const articlePage = {
      ...page,
      seo: { ...page.seo, schema_type: 'Article', og_image: '/blog/hero.jpg', date_published: '2026-01-02', date_modified: '2026-03-04' },
    };
    const ld = buildJsonLd(articlePage, { origin });
    const article = ld['@graph'].find((n: any) => n['@type'] === 'Article');
    expect(article).toBeDefined();
    expect(article.headline).toBe(page.seo.title);
    expect(article.description).toBe(page.seo.description);
    expect(article.author).toEqual({ '@id': `${origin}/#org` });
    expect(article.publisher).toEqual({ '@id': `${origin}/#org` });
    expect(article.datePublished).toBe('2026-01-02');
    expect(article.dateModified).toBe('2026-03-04');
    expect(article.image).toBe('/blog/hero.jpg');
  });

  it('omits Article date/image sub-fields that are not present on the page (item 3)', () => {
    const articlePage = { ...page, seo: { ...page.seo, schema_type: 'Article' } };
    const article = buildJsonLd(articlePage, { origin })['@graph'].find((n: any) => n['@type'] === 'Article');
    expect(article).toBeDefined();
    expect(article.datePublished).toBeUndefined();
    expect(article.dateModified).toBeUndefined();
    expect(article.image).toBeUndefined();
  });

  it('always includes a WebSite node with publisher → Organization and no SearchAction (item 5)', () => {
    const ld = buildJsonLd(page, { origin });
    const site = ld['@graph'].find((n: any) => n['@type'] === 'WebSite');
    expect(site).toBeDefined();
    expect(site['@id']).toBe(`${origin}/#website`);
    expect(site.name).toBe(page.nap.trading_name);
    expect(site.url).toBe(origin);
    expect(site.publisher).toEqual({ '@id': `${origin}/#org` });
    expect(site.potentialAction).toBeUndefined();
  });

  it('adds Organization.sameAs ONLY when social profile URLs are supplied (item 5)', () => {
    // No social data → no sameAs (existing Org node unchanged).
    const orgNoSocial = buildJsonLd(page, { origin })['@graph'].find((n: any) => n['@type'] === 'Organization');
    expect(orgNoSocial.sameAs).toBeUndefined();

    // Empty PHP map serialises as [] → still no sameAs.
    const emptyPage = { ...page, site_settings: { social: [] as string[] } };
    const orgEmpty = buildJsonLd(emptyPage, { origin })['@graph'].find((n: any) => n['@type'] === 'Organization');
    expect(orgEmpty.sameAs).toBeUndefined();

    // Populated social map → sameAs is the array of real URLs.
    const socialPage = {
      ...page,
      site_settings: { social: { facebook: 'https://facebook.com/test', linkedin: 'https://linkedin.com/company/test', blank: '' } },
    };
    const orgSocial = buildJsonLd(socialPage, { origin })['@graph'].find((n: any) => n['@type'] === 'Organization');
    expect(orgSocial.sameAs).toEqual(['https://facebook.com/test', 'https://linkedin.com/company/test']);
  });

  it('emits no structured data beyond what the page provides (no foreign literals)', () => {
    const json = JSON.stringify(buildJsonLd(page, { origin }));
    for (const leak of ['vigilservices.co.uk', '020 3098', '020 3973']) expect(json).not.toContain(leak);
  });
});
