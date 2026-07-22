// division_gateway (MAIN-HOMEPAGE-BUILD-01 / D-101) — a GOVERNED corporate→division gateway.
//
// Renders clickable cards ONLY to the four approved division subdomains, and ONLY on the
// corporate site (`page.site === 'main'`). This is deliberately NOT a generic external-card
// feature:
//   • host allow-list — any destination that is not one of the four approved division homepages
//     is dropped (fail-closed), so it can never become an arbitrary outbound-link section;
//   • corporate-only — off `main` it renders nothing, so a division site cannot use it to link to
//     another division (division→division stays impossible, D-095 G-B);
//   • it emits NO `rel="corporate_parent"` and NO `data-vf-rel` — a corporate→division gateway link
//     is not the D-095 division→corporate ownership edge and must not be labelled as one.
import type { PageJson } from '../types';

// Approved corporate→division destinations (D-033 corporate exemption + D-101 division visibility).
export const APPROVED_DIVISION_HOSTS: readonly string[] = [
  'cleaning.vigilservices.co.uk',
  'security.vigilservices.co.uk',
  'care.vigilservices.co.uk',
  'staffing.vigilservices.co.uk',
];

/** Returns the canonical https href iff its host is an approved division; otherwise null. */
export function approvedDivisionHref(href: unknown): string | null {
  if (typeof href !== 'string') return null;
  let u: URL;
  try { u = new URL(href); } catch { return null; }
  if (u.protocol !== 'https:') return null;
  return APPROVED_DIVISION_HOSTS.includes(u.host) ? u.href : null;
}

export function DivisionGateway({ fields, page }: { fields: any; page: PageJson }) {
  // Corporate-only. A division site rendering this produces nothing — no division→division links.
  if (page.site !== 'main') return null;
  const items: any[] = Array.isArray(fields.items) ? fields.items : [];
  const cards = items
    .map((it) => ({ it, href: approvedDivisionHref(it?.href) }))
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
