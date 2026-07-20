import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Shell } from '../src/shell/Shell';
import { page, nav } from './fixtures';
import type { PageJson, SiteNav } from '../src/types';

/**
 * v0.4.11 — parent-company (corporate front door) support.
 *
 * The corporate site netyvee/main has no division phone and no agreed corporate
 * enquiry target. Before this release the Shell rendered both affordances
 * unconditionally, producing `<a href="tel:"></a>` and `<a href="">` — a dead
 * contact link and an enquiry button that reloads the current page.
 *
 * That failure mode is worse than an obvious one: a dead CTA still LOOKS like a
 * working conversion path in a screenshot and passes a visual-completion check,
 * while converting nobody. Guarding it is the fix; these tests are the guard.
 */

// A corporate page: no phone, no enquiry_url. Everything else identical.
const corporatePage: PageJson = {
  ...page,
  nap: { ...page.nap, phone: '', enquiry_url: '' },
};

// A corporate nav: enquiryCtaLabel omitted entirely (optional since v0.4.11).
const corporateNav: SiteNav = (() => {
  const { enquiryCtaLabel: _omitted, ...rest } = nav as SiteNav & { enquiryCtaLabel?: string };
  return rest as SiteNav;
})();

describe('Shell — parent-company mode (no phone, no enquiry CTA)', () => {
  const html = renderToStaticMarkup(<Shell page={corporatePage} nav={corporateNav}>{null}</Shell>);

  it('renders NO dead telephone link', () => {
    // The exact defect: tel: with nothing after it.
    expect(html).not.toContain('href="tel:"');
    expect(html).not.toContain('tel:"');
  });

  it('renders NO dead enquiry CTA', () => {
    // An empty href resolves to the current page — a button that goes nowhere.
    expect(html).not.toContain('href=""');
  });

  it('does not leak the default careers CTA label onto a non-recruitment page', () => {
    expect(html).not.toContain('Careers &amp; applications');
    expect(html).not.toContain('Careers & applications');
  });

  it('still renders the parts a corporate site DOES have', () => {
    // Guarding the CTA must not gut the shell: nav, identity and email survive.
    expect(html).toContain(nav.brandName);
    expect(html).toContain(nav.companyReg);
    expect(html).toContain(`mailto:${corporatePage.nap.email}`);
    expect(html).toContain(corporatePage.nap.address!);
    for (const link of nav.primary) expect(html).toContain(link.label);
  });
});

describe('Shell — division sites are byte-identical to before (no regression)', () => {
  const html = renderToStaticMarkup(<Shell page={page} nav={nav}>{null}</Shell>);

  it('still renders the phone link when a phone exists', () => {
    expect(html).toContain(`tel:${page.nap.phone.replace(/\s+/g, '')}`);
    expect(html).toContain(page.nap.phone);
  });

  it('still renders the enquiry CTA when a funnel exists', () => {
    expect(html).toContain(page.nap.enquiry_url);
    expect(html).toContain(nav.enquiryCtaLabel!);
  });

  it('renders the CTA in every governed position (header, footer, sticky)', () => {
    // Three CTA anchors on a division site: desktop header, footer, sticky mobile.
    // The mobile-menu one only exists once the menu is open (client state).
    const occurrences = html.split(page.nap.enquiry_url).length - 1;
    expect(occurrences).toBeGreaterThanOrEqual(3);
  });
});
