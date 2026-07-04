import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Shell } from '../src/shell/Shell';
import { page, nav } from './fixtures';

const html = renderToStaticMarkup(
  <Shell page={page} nav={nav}>
    <div>PAGE CONTENT</div>
  </Shell>
);

describe('Shell v2 (v0.3 — visual-completion requirements)', () => {
  it('renders the header logo from nav.logo (config asset, not a literal)', () => {
    const header = html.match(/<header[\s\S]*?<\/header>/)![0];
    expect(header).toContain('<img');
    expect(header).toContain('/logo-test.png');
    expect(header).toContain('alt="Test Trading Co"');
  });

  it('renders a complete footer: logo, NAP, columns, legal links, company reg, CTA', () => {
    const footer = html.match(/<footer[\s\S]*?<\/footer>/)![0];
    expect(footer).toContain('/logo-test-white.png'); // footer logo variant
    expect(footer).toContain(page.nap.address!);
    expect(footer).toContain(page.nap.phone);
    expect(footer).toContain('Privacy');
    expect(footer).toContain(nav.companyReg);
    expect(footer).toContain(nav.enquiryCtaLabel);
  });

  it('footer contact links + mobile toggle meet WCAG 2.2 2.5.8 target size (v0.4.4)', () => {
    const footer = html.match(/<footer[\s\S]*?<\/footer>/)![0];
    // footer tel/email/column/legal links carry the ≥24px tapTarget box
    const telAnchor = footer.match(/<a\b[^>]*href="tel:[^"]*"[^>]*>/i)![0];
    expect(telAnchor).toMatch(/min-height:\s*24px/);
    // the md:hidden ☰ toggle is a ≥24px (here 44px) interactive box
    const toggle = html.match(/<button\b[^>]*aria-label="Open menu"[^>]*>/i)![0];
    expect(toggle).toMatch(/min-height:\s*44px/);
    expect(toggle).toMatch(/min-width:\s*44px/);
  });

  it('has exactly ONE governed sticky CTA (no duplicate/competing fixed CTAs)', () => {
    const sticky = html.match(/<a\b[^>]*class="[^"]*\bfixed\b[^"]*\bbottom-0\b[^"]*"[^>]*>/gi) ?? [];
    expect(sticky.length).toBe(1);
  });

  it('reserves footer clearance + safe-area so the sticky never obscures the footer', () => {
    expect(html).toContain('env(safe-area-inset-bottom)');
    expect(html).toMatch(/aria-hidden[^>]*height:\s*calc\(/);
  });

  it('mobile nav trigger is accessible (aria-label/expanded/controls)', () => {
    expect(html).toContain('aria-label="Open menu"');
    expect(html).toContain('aria-expanded');
    expect(html).toContain('aria-controls="vf-mobile-nav"');
  });

  it('has a skip-to-content link targeting #main-content (WCAG 2.4.1)', () => {
    expect(html).toContain('href="#main-content"');
    expect(html).toContain('id="main-content"');
  });

  it('renders the page children and leaks no real division value', () => {
    expect(html).toContain('PAGE CONTENT');
    for (const leak of ['vigilservices.co.uk', '020 3098', '020 3973']) expect(html).not.toContain(leak);
  });

  it('falls back to the brand name text when no logo is configured', () => {
    const noLogo = renderToStaticMarkup(<Shell page={page} nav={{ ...nav, logo: undefined }}><div /></Shell>);
    const header = noLogo.match(/<header[\s\S]*?<\/header>/)![0];
    expect(header).toContain(nav.brandName);
    expect(header).not.toContain('<img');
  });
});
