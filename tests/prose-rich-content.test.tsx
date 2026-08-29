// netyvee/app#344 (F2 Step 5c prerequisite) — Prose's optional `fields.blocks`
// alternative to the flat `fields.body` string.
//
// Two concerns proven separately:
// 1. Backward compatibility: every real `prose` section currently live across
//    Care/Staffing/Main (tests/fixtures-data/real-prose-sections.json, a snapshot
//    of their actual content/pages/*.json at the time this landed) renders its
//    heading and body text unchanged — none of them use `blocks`, so none of
//    this file's changes can have altered their output.
// 2. The new capability: headings, paragraphs, ordered/unordered lists, and
//    inline bold/italic/links render correctly from structured data, and an
//    unrecognised block type fails loudly outside production (matching the
//    section-registry's own unknown-type contract) rather than silently
//    dropping content.
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { RenderSections } from '../src/sections/registry';
import { withSections } from './fixtures';
import realProseSections from './fixtures-data/real-prose-sections.json';

const render = (fields: any) => renderToStaticMarkup(<RenderSections page={withSections([{ type: 'prose', fields }])} />);

// React HTML-encodes text-node characters like `'`/`"` (e.g. "someone's" ->
// "someone&#x27;s"), which is correct, safe rendering — decode the small set
// that appears in real content so backward-compatibility assertions compare
// against what the browser actually displays, not against the raw HTML bytes.
const decodeEntities = (html: string) =>
  html.replace(/&#x27;/g, "'").replace(/&#x2F;/g, '/').replace(/&quot;/g, '"').replace(/&amp;/g, '&');

describe('Prose — backward compatibility (real Care/Staffing/Main content)', () => {
  it(`renders all ${realProseSections.length} live prose sections' heading + body unchanged`, () => {
    for (const fixture of realProseSections as Array<{ heading?: string; body: string }>) {
      const html = decodeEntities(render(fixture));
      if (fixture.heading) expect(html).toContain(fixture.heading);
      expect(html).toContain(fixture.body);
      // No consumer currently uses blocks — every one must still take the
      // single-paragraph path, not the new blocks path.
      expect(html).not.toContain('Unknown prose block type');
    }
  });

  it('legacy body-only fields render exactly as before (no blocks key at all)', () => {
    expect(render({ heading: 'P', body: 'Prose body' })).toContain('Prose body');
    expect(render({})).toBe('');
  });
});

describe('Prose — rich blocks (new, additive)', () => {
  it('renders a heading block', () => {
    const html = render({ blocks: [{ type: 'heading', text: 'Introduction' }] });
    expect(html).toContain('<h2');
    expect(html).toContain('Introduction');
  });

  it('renders an h3 sub-heading when level: 3', () => {
    const html = render({ blocks: [{ type: 'heading', level: 3, text: 'Sub-point' }] });
    expect(html).toContain('<h3');
    expect(html).toContain('Sub-point');
  });

  it('renders a paragraph with plain and formatted inline content', () => {
    const html = render({
      blocks: [
        {
          type: 'paragraph',
          content: ['Plain text, ', { text: 'bold', bold: true }, ', ', { text: 'italic', italic: true }, ', and a ', { text: 'link', href: '/x' }, '.'],
        },
      ],
    });
    expect(html).toContain('Plain text');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
    expect(html).toContain('<a href="/x">link</a>');
  });

  it('renders an unordered list by default and an ordered list when ordered: true', () => {
    const ul = render({ blocks: [{ type: 'list', items: [['One'], ['Two']] }] });
    expect(ul).toContain('<ul');
    expect(ul).toContain('<li>One</li>');
    expect(ul).toContain('<li>Two</li>');

    const ol = render({ blocks: [{ type: 'list', ordered: true, items: [['First']] }] });
    expect(ol).toContain('<ol');
  });

  it('renders a full multi-block legal-page-shaped document without losing structure', () => {
    const html = render({
      heading: 'Modern Slavery Statement',
      blocks: [
        { type: 'heading', text: 'Introduction' },
        { type: 'paragraph', content: ['Published by ', { text: 'Vigil Services Ltd', bold: true }, '.'] },
        { type: 'heading', text: 'Our policies' },
        {
          type: 'list',
          items: [
            [{ text: 'Direct employment only policy', bold: true }, ' — all staff are PAYE.'],
            ['See our ', { text: 'Equal Opportunities Policy', href: '/equal-opportunities-employer-policy/' }, '.'],
          ],
        },
      ],
    });
    expect(html).toContain('Modern Slavery Statement');
    expect(html).toContain('Introduction');
    expect(html).toContain('<strong>Vigil Services Ltd</strong>');
    expect(html).toContain('Our policies');
    expect(html).toContain('<strong>Direct employment only policy</strong>');
    expect(html).toContain('<a href="/equal-opportunities-employer-policy/">Equal Opportunities Policy</a>');
  });

  it('throws loudly on an unknown block type outside production (parity with the section registry)', () => {
    expect(() => render({ blocks: [{ type: 'not_a_block' }] })).toThrow('Unknown prose block type: not_a_block');
  });

  it('blocks take priority over body when both are present (blocks is the richer contract)', () => {
    const html = render({ body: 'legacy paragraph', blocks: [{ type: 'heading', text: 'Rich heading' }] });
    expect(html).toContain('Rich heading');
    expect(html).not.toContain('legacy paragraph');
  });

  it('an empty blocks array falls back to the legacy body path', () => {
    expect(render({ body: 'fallback body', blocks: [] })).toContain('fallback body');
  });
});
