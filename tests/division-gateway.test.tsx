// division_gateway (v0.6.1) — governed corporate→division gateway.
// The only meaningful assertions are against the RENDERED output + the host allow-list:
// four approved division anchors on `main`, nothing off `main`, no arbitrary external link,
// and no corporate_parent / data-vf-rel (a gateway link is not the D-095 ownership edge).
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DivisionGateway, approvedDivisionHref, APPROVED_DIVISION_HOSTS } from '../src/sections/DivisionGateway';
import { page } from './fixtures';
import type { PageJson } from '../src/types';

const mainPage: PageJson = { ...page, site: 'main' };
const divisionPage: PageJson = { ...page, site: 'care_services' };

const fourItems = {
  heading: 'Our divisions',
  items: [
    { title: 'Care Services', body: 'Care and support for individuals at home.', href: 'https://care.vigilservices.co.uk/' },
    { title: 'Care Staffing', body: 'Care staff for care homes and providers.', href: 'https://staffing.vigilservices.co.uk/' },
    { title: 'Security Services', body: 'Manned guarding and patrols.', href: 'https://security.vigilservices.co.uk/' },
    { title: 'Cleaning Services', body: 'Commercial cleaning.', href: 'https://cleaning.vigilservices.co.uk/' },
  ],
};

const render = (fields: any, p: PageJson = mainPage) =>
  renderToStaticMarkup(<DivisionGateway fields={fields} page={p} />);

describe('division_gateway — governed corporate→division gateway', () => {
  it('renders exactly the four approved division links on the corporate site as anchors', () => {
    const html = render(fourItems);
    for (const h of APPROVED_DIVISION_HOSTS) expect(html).toContain(`href="https://${h}/"`);
    const anchors = html.match(/<a\b[^>]*href="https:\/\/[a-z]+\.vigilservices\.co\.uk\/"/g) ?? [];
    expect(anchors.length).toBe(4);
    expect(html).toContain('Care Services');
    expect(html).toContain('Care Staffing');
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
      { title: 'Care Services', href: 'https://care.vigilservices.co.uk/' },
    ]});
    expect(html).not.toContain('evil.example.com');
    expect(html).toContain('care.vigilservices.co.uk');
    expect((html.match(/<a\b/g) ?? []).length).toBe(1);
  });

  it('rejects look-alike, non-https and relative hrefs', () => {
    expect(approvedDivisionHref('https://care.vigilservices.co.uk.evil.com/')).toBeNull();
    expect(approvedDivisionHref('http://care.vigilservices.co.uk/')).toBeNull();
    expect(approvedDivisionHref('/careers/care')).toBeNull();
    expect(approvedDivisionHref(undefined)).toBeNull();
    expect(approvedDivisionHref('https://care.vigilservices.co.uk/')).toBe('https://care.vigilservices.co.uk/');
  });

  it('renders NOTHING on a division site (division→division impossible)', () => {
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
