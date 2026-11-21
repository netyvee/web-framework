'use client';
// Mount once in the layout (Shell does it). Renders nothing. On a click or middle-click of a link to the CRM client enquiry funnel,
// adds the visitor's first-touch attribution to the link just before the browser follows it. See attribution.ts for the rules.
import { useEffect } from 'react';
import { readConsent } from '../consent/Consent';
import { decorateEnquiryHref, resolveAttribution, ENQUIRY_LINK_PREFIX, type Attribution, type AttributionEnv } from './attribution';

export function AttributionLinks() {
  useEffect(() => {
    const memory: { value: Attribution | null } = { value: null };
    const env: AttributionEnv = {
      location: window.location,
      consent: () => readConsent(),
      storage: (() => {
        try { return window.sessionStorage; } catch { return null; }
      })(),
    };
    const handler = (event: Event) => {
      const target = event.target as Element | null;
      const anchor = target?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute('href') || '';
      if (!href.startsWith(ENQUIRY_LINK_PREFIX)) return;
      const next = decorateEnquiryHref(href, resolveAttribution(env, memory));
      if (next !== href) anchor.setAttribute('href', next);
    };
    // Capture the landing attribution as soon as the page is shown, so it survives navigation within the visit.
    resolveAttribution(env, memory);
    document.addEventListener('click', handler, true);
    document.addEventListener('auxclick', handler, true);
    return () => {
      document.removeEventListener('click', handler, true);
      document.removeEventListener('auxclick', handler, true);
    };
  }, []);
  return null;
}
