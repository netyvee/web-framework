'use client';
// @vigil/web-framework — Shell v2 (v0.3.0). A single coordinated client shell that
// resolves the §4/§5/§6 completion requirements the separate v0.2 Header/Footer/
// MobileCta could not (they stay exported for v0.2 consumers, unchanged):
//   §4 header logo + accessible mobile nav (aria, visible close, focus mgmt, ESC,
//      body-scroll-lock) + NO CTA duplication inside/outside the menu;
//   §5 ONE governed sticky CTA that HIDES when the nav is open, has safe-area
//      padding, and never obscures the footer/legal (the page reserves bottom space);
//   §6 complete registry-driven footer (logo, NAP, columns, legal, company reg, CTA).
// Brand assets (logo) come from nav.logo (the site config/asset contract), never a
// literal. Colour from page.brand via resolveTheme.
import Link from 'next/link';
import { useState } from 'react';
import type { PageJson, SiteNav, NavLink, NavLinkRel } from '../types';
import { resolveTheme } from '../tokens/theme';
import { primaryCtaHref, isRecruitmentPage } from '../cta';
import { NavBar, Logo } from './NavBar';

// SM-F2 — typed link metadata must survive all the way to the rendered anchor
// (footer/legal links here still need it — the nav/header itself now lives in
// NavBar, see F2-B1). See NavBar.tsx's own copy of this comment for the full
// rationale (data-vf-rel, not rel).
function relAttrs(l: NavLink): { 'data-vf-rel'?: NavLinkRel } {
  return l.rel ? { 'data-vf-rel': l.rel } : {};
}

export function Shell({ page, nav, children }: { page: PageJson; nav: SiteNav; children: React.ReactNode }) {
  const t = resolveTheme(page.brand);
  // Mobile menu open state lives here (not in NavBar) so the sticky CTA below
  // can hide itself while the menu is open — see NavBar.tsx's own comment on
  // why that coordination can't happen entirely inside NavBar.
  const [open, setOpen] = useState(false);
  const phone = page.nap.phone;
  const tel = `tel:${phone.replace(/\s+/g, '')}`;
  const enquiry = page.nap.enquiry_url;
  // WCAG 2.2 §2.5.8 Target Size (Minimum, AA): give small standalone text links a ≥24px
  // interactive box so footer/nav contact links are not sub-24px tap targets. Applied via
  // inline style so it never depends on a consumer's Tailwind purge. (v0.4.4)
  const tapTarget = { display: 'inline-block', paddingTop: 4, paddingBottom: 4, minHeight: 24 } as const;

  // Page-type-aware primary CTA: recruitment/candidate pages must NOT route people into the
  // client-sales enquiry funnel. primaryCtaHref() gives the careers funnel for recruitment pages
  // and nap.enquiry_url (byte-identical to before) for every other type. Label is candidate-aware.
  const ctaHref = primaryCtaHref(page);
  const ctaLabel = isRecruitmentPage(page) ? (nav.careersCtaLabel ?? 'Careers & applications') : nav.enquiryCtaLabel;

  // v0.4.11 — PARENT-COMPANY SUPPORT. Both of these used to render unconditionally,
  // because every consumer so far was a division site that always had a phone and an
  // enquiry funnel. The corporate front door has neither yet, and rendering them
  // anyway produced two dead elements: `<a href="tel:"></a>` (empty label, empty
  // target) and `<a href="">` (an enquiry button that reloads the current page).
  //
  // A dead CTA is worse than no CTA: it looks like a working conversion path in a
  // screenshot and in a visual-completion check, while converting nobody.
  //
  // NOT A BEHAVIOUR CHANGE FOR EXISTING CONSUMERS — care and staffing both supply a
  // phone and a non-empty enquiry_url, so both flags are true and the rendered output
  // is byte-identical. The email link at the footer has always been guarded this way
  // (`{page.nap.email && ...}`); this simply applies the established pattern to the
  // other two contact affordances.
  const hasPhone = Boolean(phone && phone.trim());
  // FUNNEL CTA (footer + sticky) — unchanged: driven by the enquiry funnel only.
  const hasCta = Boolean(ctaHref && ctaHref.trim() && ctaLabel && ctaLabel.trim());
  // v0.6.6 — HEADER CTA. A direct nav.cta (e.g. corporate "Get in touch" mailto) takes
  // precedence for the header + mobile menu, so a funnel-less corporate site still gets a
  // header action WITHOUT gaining a footer/sticky button. Division sites set no nav.cta,
  // so the header CTA resolves to the funnel CTA exactly as before (byte-identical).
  const directCta = nav.cta && nav.cta.label?.trim() && nav.cta.href?.trim() ? nav.cta : null;
  const headerCtaHref = directCta ? directCta.href : ctaHref;
  const headerCtaLabel = directCta ? directCta.label : ctaLabel;
  const hasHeaderCta = Boolean(headerCtaHref && headerCtaHref.trim() && headerCtaLabel && headerCtaLabel.trim());

  return (
    <div className="flex min-h-screen flex-col" style={{ background: page.brand.bg, color: page.brand.text, ...(t.cssVars as React.CSSProperties) }}>
      {/* ── SKIP LINK (WCAG 2.4.1 bypass block) ────────────────── */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
        style={{ background: t.accent, color: t.onAccent }}
      >
        Skip to content
      </a>
      {/* ── HEADER + MOBILE NAV (F2-B1: decomposed into NavBar) ─── */}
      <NavBar
        nav={nav}
        slug={page.slug}
        brand={page.brand}
        phone={hasPhone ? phone : undefined}
        headerCtaHref={hasHeaderCta ? headerCtaHref : undefined}
        headerCtaLabel={hasHeaderCta ? headerCtaLabel : undefined}
        open={open}
        onOpenChange={setOpen}
      />

      {/* ── MAIN ───────────────────────────────────────────────── */}
      <main id="main-content" className="flex-1">{children}</main>

      {/* ── FOOTER (complete, registry-driven) ─────────────────── */}
      <footer style={{ background: t.footer, color: t.onFooter }} className="border-t px-6 py-12" data-vf-footer>
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-4">
          <div>
            <Logo nav={nav} src={nav.logo?.footerSrc ?? nav.logo?.src} height={34} theme={t} />
            <p className="mt-4 text-[12px]" style={{ color: t.text4 }}>{page.nap.address}</p>
            {hasPhone && <p className="mt-3 text-sm"><a href={tel} className="hover:underline" style={{ color: t.secondary, ...tapTarget }}>{phone}</a></p>}
            {page.nap.email && <p className="text-sm"><a href={`mailto:${page.nap.email}`} className="hover:underline" style={{ color: t.secondary, ...tapTarget }}>{page.nap.email}</a></p>}
            {nav.social && nav.social.length > 0 && (
              <ul className="mt-3 flex list-none gap-4 p-0">
                {nav.social.map((s) => <li key={s.href}><a href={s.href} className="text-[12px]" style={{ color: t.text4, ...tapTarget }}>{s.label}</a></li>)}
              </ul>
            )}
          </div>
          {nav.footer.map((col) => (
            <div key={col.heading}>
              <p className="text-sm font-medium" style={{ color: t.secondary }}>{col.heading}</p>
              <ul className="mt-3 list-none space-y-2 p-0">
                {col.links.map((l) => <li key={l.href}><Link href={l.href} {...relAttrs(l)} className="text-sm opacity-75 hover:opacity-100" style={tapTarget}>{l.label}</Link></li>)}
              </ul>
            </div>
          ))}
          <div>
            {hasCta && <a href={ctaHref} style={{ background: t.accent, color: t.onAccent }} className="inline-block rounded-lg px-5 py-3 text-sm font-medium">{ctaLabel}</a>}
            {nav.legalLinks && nav.legalLinks.length > 0 && (
              <ul className="mt-6 list-none space-y-2 p-0">
                {nav.legalLinks.map((l) => <li key={l.href}><Link href={l.href} {...relAttrs(l)} className="text-[12px] hover:underline" style={{ color: t.text4, ...tapTarget }}>{l.label}</Link></li>)}
              </ul>
            )}
            <p className="mt-6 text-[12px]" style={{ color: t.text5 }}>{nav.companyReg}</p>
            {nav.copyright && (
              <p className="mt-2 text-[12px]" style={{ color: t.text5 }}>© {new Date().getFullYear()} {nav.brandName}. All rights reserved.</p>
            )}
          </div>
        </div>
      </footer>

      {/* ── STICKY CTA (single, governed) ──────────────────────── */}
      {/* Reserve bottom space so the sticky never obscures the footer/legal, and
          HIDE it while the mobile nav is open (no competing/duplicate CTA). */}
      {!open && hasCta && (
        <>
          <div aria-hidden className="md:hidden" style={{ height: 'calc(64px + env(safe-area-inset-bottom))' }} />
          <a
            href={ctaHref}
            style={{ background: t.accent, color: t.onAccent, paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
            className="fixed inset-x-3 bottom-0 z-30 mb-0 rounded-t-lg px-5 pt-3 text-center text-sm font-medium shadow-lg md:hidden"
          >
            {ctaLabel}
          </a>
        </>
      )}
    </div>
  );
}
