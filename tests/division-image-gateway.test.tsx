// division_image_gateway (v0.6.6) — image-led corporate gateway (MAIN-HOMEPAGE-VISUAL-02).
// The governed guarantees: four equal columns; each column's DOM order is image → title → CTA
// (founder amendment: every image sits directly above its own name + link); only approved division
// hosts render; no duplicate/fifth division; corporate-only; no rel/corporate_parent/data-vf-rel.
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DivisionImageGateway } from '../src/sections/DivisionImageGateway';
import { page } from './fixtures';
import type { PageJson } from '../src/types';

const mainPage: PageJson = { ...page, site: 'main' };
const divisionPage: PageJson = { ...page, site: 'care_services' };

const img = (name: string) => ({ url: `https://res.cloudinary.com/x/${name}.jpg`, alt: `${name} alt` });
const four = {
  items: [
    { title: 'Care Services', image: img('care'), href: 'https://care.vigilservices.co.uk/', cta_label: 'Explore more' },
    { title: 'Care Staffing', image: img('staffing'), href: 'https://staffing.vigilservices.co.uk/', cta_label: 'Explore more' },
    { title: 'Security Services', image: img('security'), href: 'https://security.vigilservices.co.uk/', cta_label: 'Explore more' },
    { title: 'Cleaning Services', image: img('cleaning'), href: 'https://cleaning.vigilservices.co.uk/', cta_label: 'Explore more' },
  ],
};
const render = (fields: any, p: PageJson = mainPage) =>
  renderToStaticMarkup(<DivisionImageGateway fields={fields} page={p} />);

// index in the rendered string of each landmark for a division, to assert DOM ordering
const at = (html: string, needle: string) => html.indexOf(needle);

describe('division_image_gateway — image-led governed gateway', () => {
  it('renders exactly four division columns', () => {
    const html = render(four);
    expect((html.match(/<li\b/g) ?? []).length).toBe(4);
    expect((html.match(/<img\b/g) ?? []).length).toBe(4);
  });

  it('preserves the approved division order', () => {
    const html = render(four);
    const order = ['Care Services', 'Care Staffing', 'Security Services', 'Cleaning Services'].map((t) => at(html, `>${t}<`));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('each image PRECEDES its title, and each title precedes its CTA (image→title→link per column)', () => {
    const html = render(four);
    for (const [name, href] of [
      ['care', 'https://care.vigilservices.co.uk/'],
      ['staffing', 'https://staffing.vigilservices.co.uk/'],
      ['security', 'https://security.vigilservices.co.uk/'],
      ['cleaning', 'https://cleaning.vigilservices.co.uk/'],
    ] as const) {
      const imgAt = at(html, `${name}.jpg`);
      const linkAt = at(html, `href="${href}"`);
      expect(imgAt).toBeGreaterThanOrEqual(0);
      expect(linkAt).toBeGreaterThan(imgAt); // image comes before its Explore-more link in the DOM
    }
    // and within a column, the title sits between the image and the link
    const careImg = at(html, 'care.jpg');
    const careTitle = at(html, '>Care Services<');
    const careLink = at(html, 'href="https://care.vigilservices.co.uk/"');
    expect(careImg).toBeLessThan(careTitle);
    expect(careTitle).toBeLessThan(careLink);
  });

  it('drops a non-approved host — never a generic external-card grid (no fifth division)', () => {
    const html = render({ items: [
      ...four.items,
      { title: 'Rogue', image: img('rogue'), href: 'https://evil.example.com/' },
    ]});
    expect((html.match(/<li\b/g) ?? []).length).toBe(4);
    expect(html).not.toContain('evil.example.com');
    expect(html).not.toContain('rogue.jpg');
  });

  it('dedupes a duplicate division (first wins) — no repeated destination', () => {
    const html = render({ items: [
      four.items[0],
      { title: 'Care Services (dup)', image: img('care2'), href: 'https://care.vigilservices.co.uk/' },
      four.items[1],
    ]});
    expect((html.match(/<li\b/g) ?? []).length).toBe(2);
    expect(html).toContain('care.jpg');
    expect(html).not.toContain('care2.jpg');
  });

  it('carries NO rel / data-vf-rel / corporate_parent', () => {
    const html = render(four);
    expect(html).not.toContain('data-vf-rel');
    expect(html).not.toContain('corporate_parent');
    expect(html).not.toMatch(/\brel="/);
  });

  it('renders NOTHING on a division site (division→division impossible)', () => {
    expect(render(four, divisionPage)).toBe('');
  });

  it('renders nothing when no approved item remains', () => {
    expect(render({ items: [{ title: 'x', href: 'https://evil.example.com/' }] })).toBe('');
    expect(render({ items: [] })).toBe('');
  });

  it('has an id="divisions" anchor for the header Divisions link', () => {
    expect(render(four)).toContain('id="divisions"');
  });

  // ---- FALSIFIABILITY: the ordering guarantee must break when the invariant is violated ----
  it('FALSIFIABLE: if two images are swapped in the data, the DOM binds the swapped image to the wrong title', () => {
    // swap care <-> security images against their titles/hrefs
    const swapped = { items: [
      { title: 'Care Services', image: img('security'), href: 'https://care.vigilservices.co.uk/' },
      four.items[1],
      { title: 'Security Services', image: img('care'), href: 'https://security.vigilservices.co.uk/' },
      four.items[3],
    ]};
    const html = render(swapped);
    // the "correct" binding (care image before the care link) no longer holds
    const careImg = at(html, 'care.jpg');            // now sits in the Security column
    const careLink = at(html, 'href="https://care.vigilservices.co.uk/"');
    // care.jpg now appears AFTER the care link (it moved to the security column further down),
    // proving a swap is detectable rather than silently accepted.
    expect(careImg).toBeGreaterThan(careLink);
  });
});
