'use client';
// Cookie consent (MAIN-COOKIE-CONSENT-01) — conservative model.
//
// Non-essential analytics is OFF by default and its script is NOT loaded until the visitor ACTIVELY
// accepts (stricter than Consent Mode alone: no request to Google fires before a choice). Reject = nothing
// loads. The only cookie set before a choice is the essential consent record, which stores ONLY the choice
// (accepted/rejected + date) — no personal data. Accept and Reject are equally prominent. A persistent
// "Cookie settings" control re-opens the banner so the choice can be changed/withdrawn.
import { useEffect, useState, useCallback } from 'react';

export type ConsentChoice = 'granted' | 'denied';
export const CONSENT_COOKIE = 'vigil_consent';

/** Read the stored choice from document.cookie. Pure; returns null when unset/invalid. */
export function readConsent(cookieString: string | undefined = typeof document !== 'undefined' ? document.cookie : ''): ConsentChoice | null {
  const m = (cookieString || '').match(new RegExp(`(?:^|;\\s*)${CONSENT_COOKIE}=([^;]*)`));
  if (!m) return null;
  try {
    const v = JSON.parse(decodeURIComponent(m[1]));
    return v && (v.choice === 'granted' || v.choice === 'denied') ? v.choice : null;
  } catch { return null; }
}

/** Serialise a choice into the essential consent cookie — stores ONLY the choice + date (no PII). */
export function consentCookieValue(choice: ConsentChoice, maxAgeDays = 180): string {
  const payload = encodeURIComponent(JSON.stringify({ choice, date: '' }));
  return `${CONSENT_COOKIE}=${payload}; Path=/; Max-Age=${maxAgeDays * 86400}; SameSite=Lax; Secure`;
}

/** True iff analytics may load. The single gate — a test asserts GA4 never renders when this is false. */
export function analyticsAllowed(choice: ConsentChoice | null): boolean {
  return choice === 'granted';
}

/** GA4 loader — renders the gtag scripts ONLY when consent is granted. No script (hence no request to
 *  Google) is emitted otherwise. Plain conditional <script> tags so the gate is deterministic in SSR and
 *  tests (unlike next/script's client-only afterInteractive injection). */
export function Analytics({ measurementId, choice }: { measurementId?: string; choice: ConsentChoice | null }) {
  if (!measurementId || !analyticsAllowed(choice)) return null;
  const init = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}` +
    `gtag('js',new Date());gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',` +
    `ad_personalization:'denied',analytics_storage:'granted'});gtag('config','${measurementId}');`;
  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} />
      <script dangerouslySetInnerHTML={{ __html: init }} />
    </>
  );
}

/**
 * CookieConsent — banner + persistent settings + gated Analytics. Client component; drop into the layout:
 *   <CookieConsent measurementId="G-XXXX" cookiePolicyHref="/cookies" />
 */
export function CookieConsent({ measurementId, cookiePolicyHref = '/cookies', floatingSettings = true }: { measurementId?: string; cookiePolicyHref?: string; floatingSettings?: boolean }) {
  const [choice, setChoice] = useState<ConsentChoice | null>(null);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const c = readConsent();
    setChoice(c);
    setOpen(c === null);   // show the banner only until a choice is made
    setReady(true);
  }, []);

  // v0.6.8 — let a "Cookie Settings" control anywhere on the page (e.g. a footer link) re-open the banner,
  // so the settings affordance can live in the footer instead of (or as well as) the floating button. Any
  // element with [data-vf-cookie-settings] or an anchor to #cookie-settings triggers it.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.('[data-vf-cookie-settings], a[href="#cookie-settings"], a[href$="#cookie-settings"]');
      if (el) { e.preventDefault(); setOpen(true); }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const decide = useCallback((c: ConsentChoice) => {
    document.cookie = consentCookieValue(c);
    setChoice(c);
    setOpen(false);
  }, []);

  return (
    <>
      <Analytics measurementId={measurementId} choice={choice} />
      {ready && (
        <>
          {open && (
            <div role="dialog" aria-modal="false" aria-label="Cookie choices"
              style={{ position: 'fixed', insetInline: 0, bottom: 0, zIndex: 50, background: '#0a1628', color: '#fff', borderTop: '1px solid rgba(255,255,255,.15)', padding: '16px' }}>
              <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ margin: 0, fontSize: 14, opacity: .9 }}>
                  We use analytics cookies only if you accept. See our{' '}
                  <a href={cookiePolicyHref} style={{ color: '#4ecdc4', textDecoration: 'underline' }}>Cookie Notice</a>.
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  {/* Reject is as prominent/accessible as Accept — same size/level, no dark pattern. */}
                  <button type="button" onClick={() => decide('denied')}
                    style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid #4ecdc4', background: 'transparent', color: '#fff', fontWeight: 500, cursor: 'pointer' }}>
                    Reject
                  </button>
                  <button type="button" onClick={() => decide('granted')}
                    style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid #4ecdc4', background: '#4ecdc4', color: '#0a1628', fontWeight: 500, cursor: 'pointer' }}>
                    Accept
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Persistent floating control to change/withdraw the choice at any time. Sites that host a
              "Cookie Settings" link in the footer (via #cookie-settings) can hide this with floatingSettings={false}. */}
          {floatingSettings && (
            <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog"
              style={{ position: 'fixed', left: 12, bottom: 12, zIndex: 40, fontSize: 12, background: 'transparent', color: '#7fb2d4', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>
              Cookie settings
            </button>
          )}
        </>
      )}
    </>
  );
}
