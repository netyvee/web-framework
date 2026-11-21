// Growth attribution forwarding (GROWTH-ATTRIBUTION-FORWARD-01, netyvee/app#344, D-192).
//
// The CRM enquiry funnel (https://app.vigilservices.co.uk/enquire/{division}) already reads utm_*, click ids (gclid, fbclid,
// msclkid) and landing_page from ITS OWN query string and stores them on the Lead. The public websites never passed them on:
// every CTA is a static link to the funnel, so a visitor who arrived from an ad or campaign reached the CRM with the
// attribution gone. This module closes that gap, conservatively:
//
//   * It only reads the six utm_* keys, the three click ids and the landing URL of the page where they were first seen.
//     Nothing else from the address, no cookies, no personal data.
//   * It decorates ONLY links to the CRM client enquiry funnel (/enquire/...) at the moment of the click. Candidate links
//     (/careers/...) are never decorated: a candidate is not a commercial Lead.
//   * Existing query parameters on the link (division, source, funnel intent) always win.
//   * Persistence across pages uses sessionStorage ONLY when the visitor has granted cookie consent (the same single gate the
//     analytics loader uses). Without consent the values live in memory for the current page view only, so a visitor who
//     lands on a page with a click id and clicks the CTA on that page is still attributed, with nothing stored on the device.
//   * First touch wins: once a landing record exists it is never overwritten by a later page.

export const ATTRIBUTION_KEYS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'gclid', 'fbclid', 'msclkid',
] as const;
export type AttributionKey = (typeof ATTRIBUTION_KEYS)[number];
export type Attribution = Partial<Record<AttributionKey | 'landing_page', string>>;

export const ATTRIBUTION_STORAGE_KEY = 'vigil_attr';
/** The CRM client enquiry funnel. Candidate links (/careers/) are deliberately not here. */
export const ENQUIRY_LINK_PREFIX = 'https://app.vigilservices.co.uk/enquire/';

const MAX_VALUE = 255;
const MAX_LANDING = 2048;
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u001f\u007f]/;

function clean(value: string | null | undefined, max: number): string | null {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  if (!v || v.length > max || CONTROL.test(v)) return null;
  return v;
}

/** The tracking values on an address query string, plus the landing URL (origin + path; the query and hash are dropped). */
export function parseAttribution(search: string, origin: string, pathname: string): Attribution {
  const params = new URLSearchParams(search);
  const out: Attribution = {};
  for (const key of ATTRIBUTION_KEYS) {
    const v = clean(params.get(key), MAX_VALUE);
    if (v) out[key] = v;
  }
  if (Object.keys(out).length === 0) return {};
  const landing = clean(`${origin}${pathname}`, MAX_LANDING);
  if (landing) out.landing_page = landing;
  return out;
}

export function hasAttribution(a: Attribution | null | undefined): a is Attribution {
  return !!a && ATTRIBUTION_KEYS.some((k) => !!a[k]);
}

/** First touch wins: an existing record is kept as it is; a new one is taken only when none exists. */
export function mergeFirstTouch(existing: Attribution | null | undefined, incoming: Attribution): Attribution {
  if (hasAttribution(existing)) return existing;
  return hasAttribution(incoming) ? incoming : {};
}

/** Add the attribution to an enquiry link. Other links, candidate links and links that already carry a key are left alone key-by-key. */
export function decorateEnquiryHref(href: string, attribution: Attribution | null | undefined): string {
  if (!hasAttribution(attribution) || !href.startsWith(ENQUIRY_LINK_PREFIX)) return href;
  const hashAt = href.indexOf('#');
  const base = hashAt >= 0 ? href.slice(0, hashAt) : href;
  const hash = hashAt >= 0 ? href.slice(hashAt) : '';
  const qAt = base.indexOf('?');
  const path = qAt >= 0 ? base.slice(0, qAt) : base;
  const params = new URLSearchParams(qAt >= 0 ? base.slice(qAt + 1) : '');
  let changed = false;
  for (const key of [...ATTRIBUTION_KEYS, 'landing_page'] as const) {
    const v = attribution[key];
    if (v && !params.has(key)) {
      params.set(key, v);
      changed = true;
    }
  }
  if (!changed) return href;
  return `${path}?${params.toString()}${hash}`;
}

export type AttributionEnv = {
  location: { search: string; origin: string; pathname: string };
  /** Reads the visitor's cookie-consent choice; null when none has been made. */
  consent: () => 'granted' | 'denied' | null;
  storage: { getItem(k: string): string | null; setItem(k: string, v: string): void } | null;
};

function readStored(storage: AttributionEnv['storage']): Attribution | null {
  try {
    const raw = storage?.getItem(ATTRIBUTION_STORAGE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Attribution;
    const out: Attribution = {};
    for (const key of ATTRIBUTION_KEYS) {
      const s = clean(v[key], MAX_VALUE);
      if (s) out[key] = s;
    }
    const landing = clean(v.landing_page, MAX_LANDING);
    if (landing) out.landing_page = landing;
    return hasAttribution(out) ? out : null;
  } catch {
    return null;
  }
}

/**
 * The attribution that applies to this page view: the stored first-touch record (consent granted only), else what is on this page's
 * own address. When consent is granted and the address carries a first touch, it is stored for later pages.
 */
export function resolveAttribution(env: AttributionEnv, memory: { value: Attribution | null }): Attribution | null {
  const fromPage = parseAttribution(env.location.search, env.location.origin, env.location.pathname);
  const granted = env.consent() === 'granted';
  const stored = granted ? readStored(env.storage) : null;
  const merged = mergeFirstTouch(stored ?? memory.value, fromPage);
  if (!hasAttribution(merged)) return null;
  memory.value = merged;
  if (granted && !stored) {
    try {
      env.storage?.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(merged));
    } catch {
      /* storage unavailable (private mode): the in-memory value still serves this page view */
    }
  }
  return merged;
}
