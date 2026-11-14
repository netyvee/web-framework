// @vitest-environment jsdom
// v1.28.0 (netyvee/app#344): canonical SiteFooter and the row rule (Founder, 2026-11-14).
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import { SiteFooter, balanceFooterColumns, FOOTER_HEADINGS } from '../src/shell/SiteFooter';
import type { SiteFooterColumn } from '../src/shell/SiteFooter';
import { Shell } from '../src/shell/Shell';
import { page, nav } from './fixtures';

afterEach(cleanup);
const links = (n: number, p = 'l') => Array.from({ length: n }, (_, i) => ({ label: `${p}${i + 1}`, href: `/${p}${i + 1}` }));

describe('balanceFooterColumns (the row rule)', () => {
  it('leaves a list at or under R unchanged', () => {
    const r = balanceFooterColumns([{ heading: 'Services', links: links(4) }], 4);
    expect(r.columns[0].links.map((l) => l.label)).toEqual(['l1', 'l2', 'l3', 'l4']);
  });
  it('cuts a longer list to R rows, the last being the hub link when one exists', () => {
    const col: SiteFooterColumn = { heading: 'Areas covered', links: links(14, 'a'), viewAll: { label: 'All areas →', href: '/areas' } };
    const out = balanceFooterColumns([col], 6).columns[0].links;
    expect(out).toHaveLength(6);
    expect(out.slice(0, 5).map((l) => l.label)).toEqual(['a1', 'a2', 'a3', 'a4', 'a5']);
    expect(out[5]).toEqual({ label: 'All areas →', href: '/areas' });
  });
  it('cuts to exactly R rows when there is no hub link', () => {
    expect(balanceFooterColumns([{ heading: 'Services', links: links(9) }], 6).columns[0].links).toHaveLength(6);
  });
  it('never drops legal links: overflow moves to the small-print list', () => {
    const r = balanceFooterColumns([{ heading: 'Legal', kind: 'legal', links: links(7, 'g') }], 6);
    expect(r.columns[0].links).toHaveLength(6);
    expect(r.legalOverflow.map((l) => l.label)).toEqual(['g7']);
  });
  it('omits empty columns and never pads short ones', () => {
    const r = balanceFooterColumns([{ heading: 'Careers', links: [] }, { heading: 'Company', links: links(2) }], 6);
    expect(r.columns.map((c) => c.heading)).toEqual(['Company']);
    expect(r.columns[0].links).toHaveLength(2);
  });
  it('exposes the canonical heading order', () => {
    expect([...FOOTER_HEADINGS]).toEqual(['Services', 'Careers', 'Areas covered', 'Company', 'Legal']);
  });
});

describe('SiteFooter', () => {
  const base = {
    logo: { src: '/brand/vigil-lockup-navy.svg', alt: 'Vigil', height: 46 },
    address: ['Line one', 'Town AB1 2CD'],
    phone: { label: '020 0000 0000', href: 'tel:02000000000' },
    email: 'x@example.test',
    cta: { label: 'Request support', href: '/enquire' },
    rows: 4,
    companyLine: '© 2026 Test Ltd · Company No. 1 · Registered in England and Wales',
    tradingNote: 'Test Div is a trading name of Test Ltd.',
  };
  it('renders the bands, contact, CTA and one nav landmark per non-empty column in the given order', () => {
    const { container } = render(
      <SiteFooter {...base} columns={[{ heading: 'Services', links: links(2) }, { heading: 'Careers', links: [] }, { heading: 'Company', links: links(2, 'c') }]} />,
    );
    const f = container.querySelector('footer') as HTMLElement;
    expect(f.hasAttribute('data-vf-footer')).toBe(true);
    const heads = Array.from(f.querySelectorAll('nav h3')).map((h) => h.textContent);
    expect(heads).toEqual(['Services', 'Company']);
    expect(within(f).getByText('020 0000 0000').getAttribute('href')).toBe('tel:02000000000');
    expect(within(f).getByText('Request support').getAttribute('href')).toBe('/enquire');
    expect(f.querySelectorAll('nav[aria-labelledby]').length).toBe(2);
  });
  it('marks the hub link and moves legal overflow to the small print', () => {
    const { container } = render(
      <SiteFooter {...base} rows={3}
        columns={[{ heading: 'Areas covered', links: links(8, 'a'), viewAll: { label: 'All areas →', href: '/areas' } }, { heading: 'Legal', kind: 'legal', links: links(4, 'g') }]} />,
    );
    expect(container.querySelector('li.vf-sf-all a')?.textContent).toBe('All areas →');
    const more = container.querySelector('ul.vf-sf-more') as HTMLElement;
    expect(within(more).getByText('g4')).toBeTruthy();
    expect(screen.getByText('Test Div is a trading name of Test Ltd.')).toBeTruthy();
  });
});

describe('Shell footer option', () => {
  it('omitted: the previous footer, no v2 marker', () => {
    const { container } = render(<Shell page={page} nav={nav}>x</Shell>);
    expect(container.querySelector('footer')?.hasAttribute('data-vf-footer-v')).toBe(false);
  });
  it('provided: renders SiteFooter with slot-ordered columns and a Legal column built from nav.legalLinks', () => {
    const n = { ...nav, footer: [{ heading: 'Company', links: links(2, 'c') }, { heading: 'Services', links: links(2, 's') }], legalLinks: [{ label: 'Privacy', href: '/privacy' }] };
    const { container } = render(<Shell page={page} nav={n} footer={{ rows: 4, logo: { src: '/l.svg' } }}>x</Shell>);
    const f = container.querySelector('footer') as HTMLElement;
    expect(f.getAttribute('data-vf-footer-v')).toBe('2');
    expect(Array.from(f.querySelectorAll('nav h3')).map((h) => h.textContent)).toEqual(['Services', 'Company', 'Legal']);
  });
});
