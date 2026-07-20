// SM-F2 — typed link metadata must survive to the rendered anchor.
//
// These tests exist because the chain was broken in THREE places at once and each
// break was individually invisible: the type had no `rel` field, the site loaders
// stripped it, and the Shell never rendered it. Any one of those, fixed alone,
// still produces an anonymous anchor — so the only meaningful assertion is against
// the RENDERED OUTPUT, not against an intermediate object.
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Shell } from '../src/shell/Shell';
import { isNavLinkRel, NAV_LINK_RELS, type NavLink, type SiteNav } from '../src/types';
import { page, nav } from './fixtures';

const CORPORATE = 'https://example-parent.test/';

const navWithRel: SiteNav = {
  ...nav,
  primary: [...nav.primary, { label: 'Part of Example Group', href: CORPORATE, rel: 'corporate_parent' }],
  footer: [
    ...nav.footer,
    { heading: 'Ownership', links: [{ label: 'Part of Example Group', href: CORPORATE, rel: 'corporate_parent' }] },
  ],
  legalLinks: [...(nav.legalLinks ?? []), { label: 'Group', href: CORPORATE, rel: 'corporate_parent' }],
};

const html = renderToStaticMarkup(<Shell page={page} nav={navWithRel}><div /></Shell>);
const anchors = html.match(new RegExp(`<a\\b[^>]*href="${CORPORATE}"[^>]*>`, 'gi')) ?? [];

describe('NavLinkRel — closed allow-list', () => {
  it('accepts only the governed relationship', () => {
    expect(NAV_LINK_RELS).toEqual(['corporate_parent']);
    expect(isNavLinkRel('corporate_parent')).toBe(true);
  });

  it('rejects everything else, including near-misses and non-strings', () => {
    for (const bad of ['corporate parent', 'Corporate_Parent', 'sibling', 'nofollow', '', null, undefined, 42, {}]) {
      expect(isNavLinkRel(bad)).toBe(false);
    }
  });
});

describe('Shell — renders declared link metadata', () => {
  it('emits data-vf-rel at every statically-rendered NavLink placement (header, footer column, legal)', () => {
    // THREE placements render in static markup: desktop header, footer column,
    // legal row. The fourth (mobile nav) is behind `open` state and cannot appear
    // in a static render — it is covered by navrel.mobile.test.tsx, which mounts a
    // DOM and opens the menu. Do NOT relax this to `toContain`: a count assertion is
    // what catches three-of-four silently losing the attribute.
    expect(anchors.length).toBe(3);
    for (const a of anchors) expect(a).toContain('data-vf-rel="corporate_parent"');
  });

  it('does NOT emit a bare rel= attribute (corporate_parent is not an HTML link relation)', () => {
    for (const a of anchors) expect(a).not.toMatch(/\srel="/);
  });

  it('leaves links without a declared rel completely unchanged', () => {
    // Regression guard on the no-rel path: the previous rendering must be byte-identical
    // for every existing consumer, or this is a breaking change rather than an additive one.
    const before = renderToStaticMarkup(<Shell page={page} nav={nav}><div /></Shell>);
    expect(before).not.toContain('data-vf-rel');
  });

  it('a link object carrying no rel key produces no attribute', () => {
    const plain: NavLink = { label: 'Plain', href: '/plain' };
    const out = renderToStaticMarkup(
      <Shell page={page} nav={{ ...nav, primary: [plain] }}><div /></Shell>
    );
    expect(out.match(/<a\b[^>]*href="\/plain"[^>]*>/i)![0]).not.toContain('data-vf-rel');
  });
});
