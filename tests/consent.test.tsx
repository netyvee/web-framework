// Cookie consent (v0.6.3) — the conservative model must be provable, and the regression guard (test 14:
// "fails if GA4 becomes unconditional") is the load-bearing one.
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Analytics, readConsent, consentCookieValue, analyticsAllowed, CONSENT_COOKIE } from '../src/consent/Consent';

const GA = 'G-TESTID12345';
const render = (choice: any, id: string | undefined = GA) => renderToStaticMarkup(<Analytics measurementId={id} choice={choice} />);

describe('consent logic', () => {
  it('readConsent returns null when unset/invalid', () => {
    expect(readConsent('')).toBeNull();
    expect(readConsent('other=1')).toBeNull();
    expect(readConsent(`${CONSENT_COOKIE}=notjson`)).toBeNull();
  });
  it('readConsent parses a stored choice', () => {
    expect(readConsent(consentCookieValue('granted').split(';')[0])).toBe('granted');
    expect(readConsent(consentCookieValue('denied').split(';')[0])).toBe('denied');
  });
  it('the consent cookie stores ONLY the choice + date (no personal data)', () => {
    const v = consentCookieValue('granted');
    const json = JSON.parse(decodeURIComponent(v.split('=')[1].split(';')[0]));
    expect(Object.keys(json).sort()).toEqual(['choice', 'date']);
    expect(v).toContain('SameSite=Lax');
    expect(v).toContain('Secure');
  });
  it('analyticsAllowed is true ONLY for granted', () => {
    expect(analyticsAllowed('granted')).toBe(true);
    expect(analyticsAllowed('denied')).toBe(false);
    expect(analyticsAllowed(null)).toBe(false);
  });
});

describe('Analytics gate — GA4 loads only after Accept', () => {
  it('renders NOTHING before a choice (null) — no gtag request', () => {
    const html = render(null);
    expect(html).toBe('');
    expect(html).not.toContain('googletagmanager');
  });
  it('renders NOTHING on reject (denied)', () => {
    const html = render('denied');
    expect(html).toBe('');
    expect(html).not.toContain('googletagmanager');
  });
  it('renders the GA4 scripts ONLY on granted', () => {
    const html = render('granted');
    expect(html).toContain('googletagmanager.com/gtag/js?id=' + GA);
    expect(html).toContain(GA);
  });
  it('REGRESSION GUARD (test 14): GA4 is never unconditional — no measurementId => nothing even if granted', () => {
    // call directly so no default id is substituted for an explicit missing id
    expect(renderToStaticMarkup(<Analytics choice="granted" />)).toBe('');
    expect(renderToStaticMarkup(<Analytics measurementId="" choice="granted" />)).toBe('');
    // and every non-granted state is empty regardless of id
    expect(render('denied')).toBe('');
    expect(render(null)).toBe('');
  });
});
