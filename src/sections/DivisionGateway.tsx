// division_gateway (MAIN-HOMEPAGE-BUILD-01 / D-101) — a GOVERNED corporate→division gateway.
//
// Renders clickable cards ONLY to the consumer's approved division subdomains, and ONLY on the
// corporate site (`page.site === 'main'`). This is deliberately NOT a generic external-card
// feature:
//   • host allow-list — any destination that is not one of the approved division homepages is
//     dropped (fail-closed), so it can never become an arbitrary outbound-link section;
//   • corporate-only — off `main` it renders nothing, so a division site cannot use it to link to
//     another division (division→division stays impossible, D-095 G-B);
//   • it emits NO `rel="corporate_parent"` and NO `data-vf-rel` — a corporate→division gateway link
//     is not the D-095 division→corporate ownership edge and must not be labelled as one.
//
// F2-B0A (netyvee/app#344): the allow-list is CONSUMER-SUPPLIED via
// `page.site_settings.approved_division_hosts`, never a literal compiled into this package — the
// framework's own source must stay identity-blank (`division-isolation --mode src`). A consumer
// that hasn't set this gets fail-closed behaviour: the gateway renders nothing, never an arbitrary
// external link. (D-033 corporate exemption + D-101 division visibility still govern which hosts
// the consumer is entitled to put in that list — that decision lives in the consumer's own site
// config, not here.)
import type { PageJson } from '../types';

/** Reads the consumer-supplied allow-list off site_settings; [] (fail-closed) when unset/malformed. */
export function approvedDivisionHosts(page: PageJson): readonly string[] {
  const raw = (page.site_settings as { approved_division_hosts?: unknown } | undefined)?.approved_division_hosts;
  return Array.isArray(raw) ? raw.filter((h): h is string => typeof h === 'string' && h.length > 0) : [];
}

/** Returns the canonical https href iff its host is in `approvedHosts`; otherwise null. */
export function approvedDivisionHref(href: unknown, approvedHosts: readonly string[]): string | null {
  if (typeof href !== 'string' || approvedHosts.length === 0) return null;
  let u: URL;
  try { u = new URL(href); } catch { return null; }
  if (u.protocol !== 'https:') return null;
  return approvedHosts.includes(u.host) ? u.href : null;
}

export function DivisionGateway({ fields, page }: { fields: any; page: PageJson }) {
  // Corporate-only. A division site rendering this produces nothing — no division→division links.
  if (page.site !== 'main') return null;
  const hosts = approvedDivisionHosts(page);
  const items: any[] = Array.isArray(fields.items) ? fields.items : [];
  const cards = items
    .map((it) => ({ it, href: approvedDivisionHref(it?.href, hosts) }))
    .filter((c) => c.href && typeof c.it?.title === 'string' && c.it.title.trim());
  if (cards.length === 0) return null;
  return (
    <section
      aria-label={typeof fields.heading === 'string' && fields.heading ? fields.heading : 'Our divisions'}
      style={{ background: page.brand.bg, color: page.brand.text }}
      className="px-6 py-16"
    >
      {typeof fields.heading === 'string' && fields.heading && (
        <h2 className="mx-auto mb-8 max-w-5xl text-2xl font-medium" style={{ color: page.brand.secondary }}>
          {fields.heading}
        </h2>
      )}
      <ul className="mx-auto grid max-w-5xl list-none gap-6 p-0 md:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ it, href }, i) => (
          <li key={i}>
            <a
              href={href as string}
              className="block h-full rounded-xl border border-white/10 p-6 no-underline transition-colors hover:border-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ color: page.brand.text, outlineColor: page.brand.cta }}
            >
              <h3 className="text-lg font-medium" style={{ color: page.brand.secondary }}>{it.title}</h3>
              {typeof it.body === 'string' && it.body && <p className="mt-2 text-sm opacity-80">{it.body}</p>}
              <span className="mt-3 inline-block text-sm font-medium" style={{ color: page.brand.cta }} aria-hidden="true">Visit site →</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
