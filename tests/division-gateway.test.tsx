// division_gateway (v0.6.1; allow-list made consumer-supplied in F2-B0A, netyvee/app#344) —
// governed corporate→division gateway. The only meaningful assertions are against the RENDERED
// output + the host allow-list: approved anchors on `main`, nothing off `main`, no arbitrary
// external link, no corporate_parent / data-vf-rel (a gateway link is not the D-095 ownership
// edge) — and, since F2-B0A, nothing at all unless the consumer has configured
// `site_settings.approved_division_hosts`. Neutral test hosts throughout (fixtures.ts's own rule:
// the test suite must never normalise a real identity literal into the framework) — this also
// proves the mechanism works for ANY consumer-supplied list, not just Vigil's real domains.
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DivisionGateway, approvedDivisionHref, approvedDivisionHosts } from '../src/sections/DivisionGateway';
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
const unconfiguredMainPage: PageJson = { ...page, site: 'main' }; // no site_settings at all

const fourItems = {
  heading: 'Our divisions',
  items: [
    { title: 'Alpha Care', body: 'Care and support for individuals at home.', href: 'https://alpha.example.invalid/' },
    { title: 'Bravo Staffing', body: 'Care staff for care homes and providers.', href: 'https://bravo.example.invalid/' },
    { title: 'Charlie Security', body: 'Manned guarding and patrols.', href: 'https://charlie.example.invalid/' },
    { title: 'Delta Cleaning', body: 'Commercial cleaning.', href: 'https://delta.example.invalid/' },
  ],
};

const render = (fields: any, p: PageJson = mainPage) =>
  renderToStaticMarkup(<DivisionGateway fields={fields} page={p} />);

describe('division_gateway — governed corporate→division gateway', () => {
  it('renders exactly the four consumer-approved division links on the corporate site as anchors', () => {
    const html = render(fourItems);
    for (const h of TEST_HOSTS) expect(html).toContain(`href="https://${h}/"`);
    const anchors = html.match(/<a\b[^>]*href="https:\/\/[a-z]+\.example\.invalid\/"/g) ?? [];
    expect(anchors.length).toBe(4);
    expect(html).toContain('Alpha Care');
    expect(html).toContain('Bravo Staffing');
  });

  it('emits NO corporate_parent and NO data-vf-rel, and carries no rel', () => {
    const html = render(fourItems);
    expect(html).not.toContain('data-vf-rel');
    expect(html).not.toContain('corporate_parent');
    expect(html).not.toMatch(/\brel="/);
  });

  it('fail-closed: drops any non-approved host — never a generic external-link section', () => {
    const html = render({ items: [
      { title: 'Arbitrary', href: 'https://evil.example.com/' },
      { title: 'Alpha Care', href: 'https://alpha.example.invalid/' },
    ]});
    expect(html).not.toContain('evil.example.com');
    expect(html).toContain('alpha.example.invalid');
    expect((html.match(/<a\b/g) ?? []).length).toBe(1);
  });

  it('fail-closed by default: renders nothing when the consumer has not configured approved_division_hosts', () => {
    // Same page.site === 'main', same well-formed items — the only difference is no
    // site_settings.approved_division_hosts. Proves the allow-list is never implied by the
    // framework itself; an unconfigured consumer gets nothing, never an unvetted link.
    expect(render(fourItems, unconfiguredMainPage)).toBe('');
  });

  it('approvedDivisionHosts(): reads the consumer allow-list off site_settings, filters non-strings, defaults to []', () => {
    expect(approvedDivisionHosts(mainPage)).toEqual(TEST_HOSTS);
    expect(approvedDivisionHosts(unconfiguredMainPage)).toEqual([]);
    expect(approvedDivisionHosts({ ...page, site_settings: { approved_division_hosts: ['ok.example.invalid', 42, null, ''] as any } })).toEqual(['ok.example.invalid']);
    expect(approvedDivisionHosts({ ...page, site_settings: { approved_division_hosts: 'not-an-array' as any } })).toEqual([]);
  });

  it('rejects look-alike, non-https and relative hrefs, and an empty allow-list is itself fail-closed', () => {
    expect(approvedDivisionHref('https://alpha.example.invalid.evil.com/', TEST_HOSTS)).toBeNull();
    expect(approvedDivisionHref('http://alpha.example.invalid/', TEST_HOSTS)).toBeNull();
    expect(approvedDivisionHref('/careers/alpha', TEST_HOSTS)).toBeNull();
    expect(approvedDivisionHref(undefined, TEST_HOSTS)).toBeNull();
    expect(approvedDivisionHref('https://alpha.example.invalid/', TEST_HOSTS)).toBe('https://alpha.example.invalid/');
    expect(approvedDivisionHref('https://alpha.example.invalid/', [])).toBeNull();
  });

  it('renders NOTHING on a division site (division→division impossible), even when configured', () => {
    expect(render(fourItems, divisionPage)).toBe('');
  });

  it('renders nothing when no approved item remains', () => {
    expect(render({ items: [{ title: 'x', href: 'https://evil.example.com/' }] })).toBe('');
    expect(render({ items: [] })).toBe('');
  });

  it('uses semantic list + heading structure and real anchors (keyboard-focusable)', () => {
    const html = render(fourItems);
    expect(html).toContain('<h2');
    expect(html).toContain('<h3');
    expect(html).toContain('<ul');
    expect(html).toContain('<a ');
  });
});
