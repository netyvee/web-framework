import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Header } from '../src/shell/Header';
import { Footer } from '../src/shell/Footer';
import { MobileCta } from '../src/shell/MobileCta';
import { page, nav } from './fixtures';

describe('shell — NAP by construction', () => {
  it('Header: brand name from nav, phone + enquiry from page.nap', () => {
    const html = renderToStaticMarkup(<Header page={page} nav={nav} />);
    expect(html).toContain('Test Trading Co');
    expect(html).toContain('020 0000 0000');
    expect(html).toContain('tel:02000000000');
    expect(html).toContain(page.nap.enquiry_url);
    expect(html).toContain('Widgets');
  });

  it('Footer: full NAP from page.nap, columns + companyReg + CTA label from nav', () => {
    const html = renderToStaticMarkup(<Footer page={page} nav={nav} />);
    for (const s of [
      page.nap.trading_name,
      page.nap.address!,
      page.nap.phone,
      `mailto:${page.nap.email}`,
      nav.companyReg,
      nav.enquiryCtaLabel,
      page.nap.enquiry_url,
    ]) {
      expect(html).toContain(s);
    }
  });

  it('MobileCta: label from nav + phone from page.nap', () => {
    const html = renderToStaticMarkup(<MobileCta page={page} nav={nav} />);
    expect(html).toContain(nav.enquiryCtaLabel);
    expect(html).toContain(page.nap.phone);
    expect(html).toContain(page.nap.enquiry_url);
  });

  it('shell output carries NO value that did not come from page/nav fixtures', () => {
    const html =
      renderToStaticMarkup(<Header page={page} nav={nav} />) +
      renderToStaticMarkup(<Footer page={page} nav={nav} />) +
      renderToStaticMarkup(<MobileCta page={page} nav={nav} />);
    // Real division identities must be impossible: the fixtures are neutral, so ANY
    // real phone/domain appearing here would mean a literal in the framework.
    for (const leak of ['vigilservices.co.uk', '020 3098', '020 3973']) {
      expect(html).not.toContain(leak);
    }
  });
});
