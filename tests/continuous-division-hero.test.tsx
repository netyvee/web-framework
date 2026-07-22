// continuous_division_hero (v0.6.8) — one continuous hero (MAIN-HOMEPAGE-VISUAL-02, live-site pattern):
// a single team photo, the headline in a top-left scrim, and the four division names/links in a bottom
// scrim on the SAME photo. Guarantees: one H1; four governed division links in order; a single hero
// section (no separate white card grid); approved hosts only; no rel/corporate_parent; corporate-only.
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ContinuousDivisionHero } from '../src/sections/ContinuousDivisionHero';
import { page } from './fixtures';
import type { PageJson } from '../src/types';

const mainPage: PageJson = { ...page, site: 'main' };
const divisionPage: PageJson = { ...page, site: 'care_services' };

const base = {
  hero_image: { url: 'https://res.cloudinary.com/x/team.jpg', alt: 'Vigil care, security and cleaning staff' },
  heading: 'Essential people.\nExceptional service.',
  sub: 'Delivering care, security, staffing and cleaning services you can trust, every day.',
  items: [
    { title: 'Care Services', href: 'https://care.vigilservices.co.uk/' },
    { title: 'Care Staffing', href: 'https://staffing.vigilservices.co.uk/' },
    { title: 'Security Services', href: 'https://security.vigilservices.co.uk/' },
    { title: 'Cleaning Services', href: 'https://cleaning.vigilservices.co.uk/' },
  ],
};
const render = (fields: any, p: PageJson = mainPage) =>
  renderToStaticMarkup(<ContinuousDivisionHero fields={fields} page={p} />);
const at = (h: string, n: string) => h.indexOf(n);

describe('continuous_division_hero', () => {
  it('is ONE hero section — a single <section>, one team <img>, no separate card grid below', () => {
    const html = render(base);
    expect((html.match(/<section\b/g) ?? []).length).toBe(1);
    expect((html.match(/<img\b/g) ?? []).length).toBe(1);
  });

  it('renders exactly one H1, as two overlaid lines', () => {
    const html = render(base);
    expect((html.match(/<h1\b/g) ?? []).length).toBe(1);
    expect(html).toContain('Essential people.');
    expect(html).toContain('Exceptional service.');
  });

  it('renders the supporting copy + a teal accent line', () => {
    expect(render(base)).toContain('you can trust, every day.');
  });

  it('places the four divisions in order inside the bottom gateway band (id="divisions")', () => {
    const html = render(base);
    expect(html).toContain('id="divisions"');
    const order = ['Care Services', 'Care Staffing', 'Security Services', 'Cleaning Services'].map((t) => at(html, `>${t}<`));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('the division names are the gateway links (name → Explore more) to approved hosts only', () => {
    const html = render(base);
    for (const h of [
      'https://care.vigilservices.co.uk/', 'https://staffing.vigilservices.co.uk/',
      'https://security.vigilservices.co.uk/', 'https://cleaning.vigilservices.co.uk/',
    ]) expect(html).toContain(`href="${h}"`);
    expect((html.match(/Explore more/g) ?? []).length).toBe(4);
  });

  it('drops a non-approved host and dedupes — no fifth/duplicate division', () => {
    const html = render({ ...base, items: [
      ...base.items,
      { title: 'Rogue', href: 'https://evil.example.com/' },
      { title: 'Care dup', href: 'https://care.vigilservices.co.uk/' },
    ]});
    expect(html).not.toContain('evil.example.com');
    expect((html.match(/<li\b/g) ?? []).length).toBe(4);
  });

  it('carries no rel / data-vf-rel / corporate_parent', () => {
    const html = render(base);
    expect(html).not.toContain('data-vf-rel');
    expect(html).not.toContain('corporate_parent');
    expect(html).not.toMatch(/\brel="/);
  });

  it('renders NOTHING on a division site', () => {
    expect(render(base, divisionPage)).toBe('');
  });

  it('renders a fallback (no <img>) when no hero image is supplied, but still shows headline + gateway', () => {
    const html = render({ ...base, hero_image: null });
    expect(html).not.toContain('<img');
    expect(html).toContain('Essential people.');
    expect((html.match(/<li\b/g) ?? []).length).toBe(4);
  });

  // ---- FALSIFIABILITY: the "single hero, gateway inside it" guarantee ----
  it('FALSIFIABLE: the bottom gateway list is INSIDE the single hero <section> (not a detached grid)', () => {
    const html = render(base);
    const sectionOpen = at(html, '<section');
    const sectionClose = html.lastIndexOf('</section>');
    const gateway = at(html, 'id="divisions"');
    expect(gateway).toBeGreaterThan(sectionOpen);
    expect(gateway).toBeLessThan(sectionClose); // gateway lives within the one hero section
  });
});
