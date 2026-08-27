// division_image_gateway (v0.6.6; allow-list made consumer-supplied in F2-B0A, netyvee/app#344) —
// image-led corporate gateway (MAIN-HOMEPAGE-VISUAL-02). The governed guarantees: four equal
// columns; each column's DOM order is image → title → CTA (founder amendment: every image sits
// directly above its own name + link); only approved division hosts render; no duplicate/fifth
// division; corporate-only; no rel/corporate_parent/data-vf-rel; since F2-B0A, nothing renders
// unless the consumer has configured site_settings.approved_division_hosts. Neutral test hosts
// throughout (fixtures.ts's own rule: never a real identity literal in the test suite).
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DivisionImageGateway } from '../src/sections/DivisionImageGateway';
import { page } from './fixtures';
import type { PageJson } from '../src/types';

const TEST_HOSTS = [
  'alpha.example.invalid',
  'bravo.example.invalid',
  'charlie.example.invalid',
  'delta.example.invalid',
];

const mainPage: PageJson = { ...page, site: 'main', site_settings: { approved_division_hosts: TEST_HOSTS } };
const divisionPage: PageJson = { ...page, site: 'care_services', site_settings: { approved_division_hosts: TEST_HOSTS } };
const unconfiguredMainPage: PageJson = { ...page, site: 'main' };

const img = (name: string) => ({ url: `https://res.cloudinary.com/x/${name}.jpg`, alt: `${name} alt` });
const four = {
  items: [
    { title: 'Alpha Care', image: img('alpha'), href: 'https://alpha.example.invalid/', cta_label: 'Explore more' },
    { title: 'Bravo Staffing', image: img('bravo'), href: 'https://bravo.example.invalid/', cta_label: 'Explore more' },
    { title: 'Charlie Security', image: img('charlie'), href: 'https://charlie.example.invalid/', cta_label: 'Explore more' },
    { title: 'Delta Cleaning', image: img('delta'), href: 'https://delta.example.invalid/', cta_label: 'Explore more' },
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
    const order = ['Alpha Care', 'Bravo Staffing', 'Charlie Security', 'Delta Cleaning'].map((t) => at(html, `>${t}<`));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('each image PRECEDES its title, and each title precedes its CTA (image→title→link per column)', () => {
    const html = render(four);
    for (const [name, href] of [
      ['alpha', 'https://alpha.example.invalid/'],
      ['bravo', 'https://bravo.example.invalid/'],
      ['charlie', 'https://charlie.example.invalid/'],
      ['delta', 'https://delta.example.invalid/'],
    ] as const) {
      const imgAt = at(html, `${name}.jpg`);
      const linkAt = at(html, `href="${href}"`);
      expect(imgAt).toBeGreaterThanOrEqual(0);
      expect(linkAt).toBeGreaterThan(imgAt); // image comes before its Explore-more link in the DOM
    }
    // and within a column, the title sits between the image and the link
    const alphaImg = at(html, 'alpha.jpg');
    const alphaTitle = at(html, '>Alpha Care<');
    const alphaLink = at(html, 'href="https://alpha.example.invalid/"');
    expect(alphaImg).toBeLessThan(alphaTitle);
    expect(alphaTitle).toBeLessThan(alphaLink);
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
      { title: 'Alpha Care (dup)', image: img('alpha2'), href: 'https://alpha.example.invalid/' },
      four.items[1],
    ]});
    expect((html.match(/<li\b/g) ?? []).length).toBe(2);
    expect(html).toContain('alpha.jpg');
    expect(html).not.toContain('alpha2.jpg');
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

  it('fail-closed by default: renders nothing when the consumer has not configured approved_division_hosts', () => {
    expect(render(four, unconfiguredMainPage)).toBe('');
  });

  it('has an id="divisions" anchor for the header Divisions link', () => {
    expect(render(four)).toContain('id="divisions"');
  });

  // ---- FALSIFIABILITY: the ordering guarantee must break when the invariant is violated ----
  it('FALSIFIABLE: if two images are swapped in the data, the DOM binds the swapped image to the wrong title', () => {
    // swap alpha <-> charlie images against their titles/hrefs
    const swapped = { items: [
      { title: 'Alpha Care', image: img('charlie'), href: 'https://alpha.example.invalid/' },
      four.items[1],
      { title: 'Charlie Security', image: img('alpha'), href: 'https://charlie.example.invalid/' },
      four.items[3],
    ]};
    const html = render(swapped);
    // the "correct" binding (alpha image before the alpha link) no longer holds
    const alphaImg = at(html, 'alpha.jpg');            // now sits in the Charlie column
    const alphaLink = at(html, 'href="https://alpha.example.invalid/"');
    // alpha.jpg now appears AFTER the alpha link (it moved to the charlie column further down),
    // proving a swap is detectable rather than silently accepted.
    expect(alphaImg).toBeGreaterThan(alphaLink);
  });
});
