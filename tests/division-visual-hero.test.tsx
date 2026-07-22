// division_visual_hero (v0.6.5) — corporate homepage hero with FOUR fixed-order division image
// placeholders (MAIN-HOMEPAGE-VISUAL-01). The governed contract is: exactly four divisions, fixed order,
// approved ids only, non-clickable (no links / no relationship edge), no carousel. Images are data and
// are independently replaceable; a missing image renders a polished placeholder, never a broken box.
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DivisionVisualHero, DIVISION_VISUAL_IDS } from '../src/sections/DivisionVisualHero';
import { page } from './fixtures';
import type { PageJson } from '../src/types';

const mainPage: PageJson = { ...page, site: 'main' };

const base = {
  heading: 'Vigil Services Ltd',
  sub: 'Four specialist divisions providing care, healthcare staffing, security and commercial cleaning. Choose the service you need.',
};

const render = (fields: any, p: PageJson = mainPage) =>
  renderToStaticMarkup(<DivisionVisualHero fields={fields} page={p} />);

// helper: the ordered labels as they must appear in the rendered figcaptions
const LABELS = ['Care Services', 'Care Staffing', 'Security Services', 'Cleaning Services'];
const captionOrder = (html: string) =>
  LABELS.map((l) => html.indexOf(`>${l}</figcaption>`));

describe('division_visual_hero — four fixed-order division placeholders', () => {
  it('1+8: renders exactly four image slots (figures) with no image data supplied', () => {
    const html = render(base);
    expect((html.match(/<figure\b/g) ?? []).length).toBe(4);
  });

  it('2+13-order: renders the four divisions in the fixed approved order', () => {
    const html = render(base);
    const idx = captionOrder(html);
    expect(idx.every((i) => i >= 0)).toBe(true);
    expect(idx).toEqual([...idx].sort((a, b) => a - b)); // strictly increasing = correct order
    expect(DIVISION_VISUAL_IDS).toEqual(['care_services', 'care_staffing', 'security_services', 'cleaning_services']);
  });

  it('3+4+14: only approved division ids are honoured — an unknown/fifth division can never add a slot', () => {
    const html = render({ ...base, images: [
      { division: 'facilities', image: { url: 'https://x/rogue.jpg', alt: 'rogue' } }, // unknown
      { division: 'care_services', image: { url: 'https://x/care.jpg', alt: 'Care' } },
    ]});
    expect((html.match(/<figure\b/g) ?? []).length).toBe(4); // still four, not five
    expect(html).not.toContain('rogue.jpg');
    expect(html).not.toContain('facilities');
    expect(html).toContain('care.jpg'); // the approved one did bind
  });

  it('5: a duplicate division entry collapses to one slot (first wins) — never a fifth figure', () => {
    const html = render({ ...base, images: [
      { division: 'care_services', image: { url: 'https://x/first.jpg', alt: 'first' } },
      { division: 'care_services', image: { url: 'https://x/second.jpg', alt: 'second' } },
    ]});
    expect((html.match(/<figure\b/g) ?? []).length).toBe(4);
    expect(html).toContain('first.jpg');
    expect(html).not.toContain('second.jpg');
  });

  it('6: a missing image renders the polished placeholder (division label), not a broken image', () => {
    const html = render(base); // no images at all
    // no <img> at all in pure placeholder state, but every division label is present as text
    expect(html).not.toContain('<img');
    for (const l of LABELS) expect(html).toContain(l);
  });

  it('7+26: every slot carries a stable aspect ratio (no layout shift when an image lands later)', () => {
    const html = render(base);
    expect((html.match(/aspect-ratio:\s*4 \/ 3/g) ?? []).length).toBe(4);
  });

  it('11: contains NO carousel / slider / auto-rotation markup', () => {
    const html = render(base).toLowerCase();
    for (const bad of ['carousel', 'slider', 'swiper', 'data-slide', 'autoplay']) expect(html).not.toContain(bad);
  });

  it('12: renders exactly one H1', () => {
    const html = render(base);
    expect((html.match(/<h1\b/g) ?? []).length).toBe(1);
    expect(html).toContain('Vigil Services Ltd');
  });

  it('15+16: emits NO corporate_parent, NO data-vf-rel and NO rel — it is a relationship-free visual', () => {
    const html = render({ ...base, images: [
      { division: 'security_services', image: { url: 'https://x/sec.jpg', alt: 'Security team' } },
    ]});
    expect(html).not.toContain('corporate_parent');
    expect(html).not.toContain('data-vf-rel');
    expect(html).not.toMatch(/\brel="/);
  });

  it('non-clickable: renders no anchors — the gateway cards remain the sole destinations', () => {
    const html = render({ ...base, images: LABELS.map((_, i) => ({
      division: DIVISION_VISUAL_IDS[i], image: { url: `https://x/${i}.jpg`, alt: `img ${i}` },
    }))});
    expect(html).not.toContain('<a ');
  });

  it('27-imageState: a supplied image renders as an <img> with its alt (independent replaceability)', () => {
    const html = render({ ...base, images: [
      { division: 'cleaning_services', image: { url: 'https://x/clean.jpg', alt: 'Commercial cleaning team' } },
    ]});
    expect(html).toContain('src="https://x/clean.jpg"');
    expect(html).toContain('alt="Commercial cleaning team"');
    // the other three remain placeholders (still four figures total)
    expect((html.match(/<figure\b/g) ?? []).length).toBe(4);
  });

  it('a11y: uses a semantic list grouping the four division visuals', () => {
    const html = render(base);
    expect(html).toContain('<ul');
    expect((html.match(/<li\b/g) ?? []).length).toBe(4);
    expect(html).toContain('aria-label="Our divisions"');
  });
});
