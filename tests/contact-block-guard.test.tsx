// contact_block phone/CTA guard (v0.6.2) — a phone-less / funnel-less corporate site (M-14 / C-12)
// must not render a dead tel: link or a dead CTA button; existing phone+CTA consumers are unaffected.
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ContactBlock } from '../src/sections/ContactBlock';
import { page } from './fixtures';
import type { PageJson } from '../src/types';

const corp: PageJson = { ...page, site: 'main', nap: { ...page.nap, phone: '', email: 'info@vigilservices.co.uk', enquiry_url: '' } };
const html = renderToStaticMarkup(<ContactBlock fields={{}} page={corp} />);

describe('contact_block — phone/CTA guard', () => {
  it('renders NO tel: link and no "Call" when phone is empty', () => {
    expect(html).not.toContain('tel:');
    expect(html).not.toContain('>Call');
  });
  it('renders the email as a clickable mailto', () => {
    expect(html).toContain('mailto:info@vigilservices.co.uk');
    expect(html).toContain('Email');
  });
  it('renders NO dead CTA button when there is no enquiry funnel', () => {
    expect(html).not.toContain('Make an enquiry');
  });
  it('still renders phone + CTA when present (existing consumers unaffected)', () => {
    const withPhone: PageJson = { ...page, nap: { ...page.nap, phone: '020 1234 5678', email: 'x@y.z', enquiry_url: 'https://app.vigilservices.co.uk/enquire/care' } };
    const h = renderToStaticMarkup(<ContactBlock fields={{}} page={withPhone} />);
    expect(h).toContain('tel:02012345678');
    expect(h).toContain('Call');
    expect(h).toContain('mailto:x@y.z');
  });
});
