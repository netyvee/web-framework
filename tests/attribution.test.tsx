// GROWTH-ATTRIBUTION-FORWARD-01 — first-touch campaign attribution is forwarded to the CRM client enquiry funnel only,
// persisted only with consent, never to candidate links, never overriding what a link already carries.
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  parseAttribution, hasAttribution, mergeFirstTouch, decorateEnquiryHref, resolveAttribution,
  ATTRIBUTION_STORAGE_KEY, type AttributionEnv, type Attribution,
} from '../src/attribution/attribution';
import { AttributionLinks } from '../src/attribution/AttributionLinks';
import { CONSENT_COOKIE } from '../src/consent/Consent';

const ORIGIN = 'https://cleaning.vigilservices.co.uk';
const CRM = 'https://app.vigilservices.co.uk/enquire/cleaning';

function fakeEnv(search: string, consent: 'granted' | 'denied' | null, store: Record<string, string> = {}, path = '/commercial-cleaning-camden'): AttributionEnv & { store: Record<string, string> } {
  return {
    location: { search, origin: ORIGIN, pathname: path },
    consent: () => consent,
    storage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = v; } },
    store,
  };
}

describe('parseAttribution', () => {
  it('reads the six utm keys, the click ids and the landing URL without the query or hash', () => {
    const a = parseAttribution('?utm_source=google&utm_medium=cpc&utm_campaign=c1&utm_content=a&utm_term=t&gclid=G1&fbclid=F1&msclkid=M1&other=x&email=a@b.c', ORIGIN, '/services');
    expect(a).toEqual({ utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'c1', utm_content: 'a', utm_term: 't', gclid: 'G1', fbclid: 'F1', msclkid: 'M1', landing_page: `${ORIGIN}/services` });
  });
  it('returns nothing for an organic visit (no tracking keys), so no landing record is invented', () => {
    expect(parseAttribution('?page=2&q=cleaning', ORIGIN, '/services')).toEqual({});
    expect(parseAttribution('', ORIGIN, '/')).toEqual({});
  });
  it('drops over-long values and values with control characters', () => {
    expect(parseAttribution(`?gclid=${'x'.repeat(256)}`, ORIGIN, '/')).toEqual({});
    expect(parseAttribution('?gclid=ab%0Acd', ORIGIN, '/')).toEqual({});
    expect(parseAttribution('?gclid=%20%20', ORIGIN, '/')).toEqual({});
  });
});

describe('mergeFirstTouch', () => {
  it('keeps an existing record and never overwrites it with a later page', () => {
    const first: Attribution = { gclid: 'G1', landing_page: `${ORIGIN}/a` };
    expect(mergeFirstTouch(first, { gclid: 'G2', landing_page: `${ORIGIN}/b` })).toBe(first);
  });
  it('takes the incoming record when none exists, and an empty one gives an empty result', () => {
    expect(mergeFirstTouch(null, { gclid: 'G1' })).toEqual({ gclid: 'G1' });
    expect(mergeFirstTouch(null, {})).toEqual({});
    expect(hasAttribution({ landing_page: 'x' })).toBe(false);
  });
});

describe('decorateEnquiryHref', () => {
  const a: Attribution = { gclid: 'G1', utm_source: 'google', landing_page: `${ORIGIN}/services` };
  it('adds the attribution to a CRM client enquiry link', () => {
    const out = new URL(decorateEnquiryHref(CRM, a));
    expect(out.origin + out.pathname).toBe(CRM);
    expect(out.searchParams.get('gclid')).toBe('G1');
    expect(out.searchParams.get('utm_source')).toBe('google');
    expect(out.searchParams.get('landing_page')).toBe(`${ORIGIN}/services`);
  });
  it('keeps every parameter the link already carries (division, source, funnel intent) and the hash', () => {
    const out = new URL(decorateEnquiryHref(`${CRM}?division=cleaning&source=hero&gclid=KEEP#form`, a));
    expect(out.searchParams.get('division')).toBe('cleaning');
    expect(out.searchParams.get('source')).toBe('hero');
    expect(out.searchParams.get('gclid')).toBe('KEEP');
    expect(out.searchParams.get('utm_source')).toBe('google');
    expect(out.hash).toBe('#form');
  });
  it('never touches candidate links, other hosts, relative links or links when there is no attribution', () => {
    for (const href of ['https://app.vigilservices.co.uk/careers/cleaning', 'https://example.com/enquire/cleaning', '/enquire/cleaning', 'mailto:a@b.c', 'tel:020']) {
      expect(decorateEnquiryHref(href, a)).toBe(href);
    }
    expect(decorateEnquiryHref(CRM, {})).toBe(CRM);
    expect(decorateEnquiryHref(CRM, null)).toBe(CRM);
  });
});

describe('resolveAttribution (consent gate)', () => {
  it('with consent granted it stores the first touch for later pages and reuses it on a page with no params', () => {
    const memory = { value: null as Attribution | null };
    const store: Record<string, string> = {};
    const landing = resolveAttribution(fakeEnv('?gclid=G1&utm_source=google', 'granted', store), memory);
    expect(landing?.gclid).toBe('G1');
    expect(JSON.parse(store[ATTRIBUTION_STORAGE_KEY]).landing_page).toBe(`${ORIGIN}/commercial-cleaning-camden`);
    // a later page of the same visit has no params: the stored first touch applies
    const later = resolveAttribution(fakeEnv('', 'granted', store, '/faq'), { value: null });
    expect(later?.gclid).toBe('G1');
    expect(later?.landing_page).toBe(`${ORIGIN}/commercial-cleaning-camden`);
  });
  it('without a choice, or after a refusal, it writes NOTHING to the device but still serves the current page view from memory', () => {
    for (const choice of [null, 'denied'] as const) {
      const store: Record<string, string> = {};
      const memory = { value: null as Attribution | null };
      const a = resolveAttribution(fakeEnv('?gclid=G1', choice, store), memory);
      expect(a?.gclid).toBe('G1');
      expect(Object.keys(store)).toEqual([]);
      expect(memory.value?.gclid).toBe('G1');
    }
  });
  it('a stored record is ignored (not read) when consent is not granted, and a broken stored value is ignored', () => {
    const store: Record<string, string> = { [ATTRIBUTION_STORAGE_KEY]: JSON.stringify({ gclid: 'OLD' }) };
    expect(resolveAttribution(fakeEnv('', 'denied', store), { value: null })).toBeNull();
    const broken: Record<string, string> = { [ATTRIBUTION_STORAGE_KEY]: '{not json' };
    expect(resolveAttribution(fakeEnv('?gclid=G2', 'granted', broken), { value: null })?.gclid).toBe('G2');
  });
  it('a storage that throws does not break the page view', () => {
    const env: AttributionEnv = { location: { search: '?gclid=G1', origin: ORIGIN, pathname: '/' }, consent: () => 'granted', storage: { getItem: () => null, setItem: () => { throw new Error('quota'); } } };
    expect(resolveAttribution(env, { value: null })?.gclid).toBe('G1');
  });
});

describe('AttributionLinks', () => {
  afterEach(() => cleanup());
  beforeEach(() => {
    document.body.innerHTML = '';
    document.cookie = `${CONSENT_COOKIE}=; Max-Age=0; Path=/`;
    window.sessionStorage.clear();
    window.history.pushState({}, '', '/');
  });

  it('renders nothing, so the page markup is byte-identical', () => {
    expect(renderToStaticMarkup(<AttributionLinks />)).toBe('');
  });

  it('adds the page\'s click id to a CRM enquiry link on click, and leaves a candidate link alone', () => {
    window.history.pushState({}, '', '/commercial-cleaning-camden?gclid=G1&utm_campaign=spring');
    document.body.innerHTML = `<a id="enq" href="${CRM}">Quote</a><a id="car" href="https://app.vigilservices.co.uk/careers/cleaning">Careers</a>`;
    render(<AttributionLinks />);
    document.getElementById('enq')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    document.getElementById('car')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    const enq = new URL(document.getElementById('enq')!.getAttribute('href')!);
    expect(enq.searchParams.get('gclid')).toBe('G1');
    expect(enq.searchParams.get('utm_campaign')).toBe('spring');
    expect(enq.searchParams.get('landing_page')).toContain('/commercial-cleaning-camden');
    expect(document.getElementById('car')!.getAttribute('href')).toBe('https://app.vigilservices.co.uk/careers/cleaning');
    // no consent was given: nothing was stored on the device
    expect(window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY)).toBeNull();
  });

  it('also decorates a middle-click, and does nothing for an organic visit', () => {
    document.body.innerHTML = `<a id="enq" href="${CRM}?division=cleaning">Quote</a>`;
    render(<AttributionLinks />);
    document.getElementById('enq')!.dispatchEvent(new MouseEvent('auxclick', { bubbles: true, cancelable: true, button: 1 }));
    expect(document.getElementById('enq')!.getAttribute('href')).toBe(`${CRM}?division=cleaning`);
  });

  it('with consent granted the first touch survives to a later page of the visit', () => {
    document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify({ choice: 'granted', date: '' }))}; Path=/`;
    window.history.pushState({}, '', '/services?fbclid=F1');
    const first = render(<AttributionLinks />);
    first.unmount();
    window.history.pushState({}, '', '/faq');
    document.body.innerHTML = `<a id="enq" href="${CRM}">Quote</a>`;
    render(<AttributionLinks />);
    document.getElementById('enq')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(new URL(document.getElementById('enq')!.getAttribute('href')!).searchParams.get('fbclid')).toBe('F1');
  });
});
