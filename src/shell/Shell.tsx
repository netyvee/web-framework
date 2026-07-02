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
import { useEffect, useRef, useState } from 'react';
import type { PageJson, SiteNav } from '../types';
import { resolveTheme } from '../tokens/theme';

function Logo({ nav, src, height, theme }: { nav: SiteNav; src?: string; height: number; theme: { text: string } }) {
  const logoSrc = src;
  if (logoSrc) {
    // plain <img> (not next/image) so the logo needs no per-site remotePatterns and
    // renders identically as a repo-static or CDN asset.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoSrc} alt={nav.logo?.alt ?? nav.brandName} height={height} style={{ height, width: 'auto' }} />;
  }
  return <span className="font-display text-lg font-medium" style={{ color: theme.text }}>{nav.brandName}</span>;
}

export function Shell({ page, nav, children }: { page: PageJson; nav: SiteNav; children: React.ReactNode }) {
  const t = resolveTheme(page.brand);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // §4 body-scroll-lock + focus management + ESC-to-close
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
      toggleRef.current?.focus();
    };
  }, [open]);

  const phone = page.nap.phone;
  const tel = `tel:${phone.replace(/\s+/g, '')}`;
  const enquiry = page.nap.enquiry_url;

  return (
    <div className="flex min-h-screen flex-col" style={{ background: page.brand.bg, color: page.brand.text, ...(t.cssVars as React.CSSProperties) }}>
      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header style={{ background: page.brand.bg, color: page.brand.text }} className="sticky top-0 z-40 border-b" >
        <div className="border-b" style={{ borderColor: t.line }}>
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" aria-label={nav.brandName} className="flex items-center">
              <Logo nav={nav} src={nav.logo?.src} height={30} theme={t} />
            </Link>
            <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
              {nav.primary.map((l) => (
                <Link key={l.href} href={l.href} className="text-sm opacity-85 hover:opacity-100">{l.label}</Link>
              ))}
              <a href={tel} className="text-sm font-medium" style={{ color: t.secondary }}>{phone}</a>
              <a href={enquiry} style={{ background: t.accent, color: t.onAccent }} className="rounded-lg px-4 py-2 text-sm font-medium">{nav.enquiryCtaLabel}</a>
            </nav>
            <button
              ref={toggleRef}
              onClick={() => setOpen(true)}
              className="md:hidden"
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="vf-mobile-nav"
              style={{ color: page.brand.text, fontSize: 22, lineHeight: 1 }}
            >☰</button>
          </div>
        </div>
      </header>

      {/* ── MOBILE NAV (full-screen, accessible) ───────────────── */}
      {open && (
        <div
          id="vf-mobile-nav"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 z-50 flex flex-col md:hidden"
          style={{ background: page.brand.bg, color: page.brand.text }}
        >
          <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: t.line }}>
            <Logo nav={nav} src={nav.logo?.src} height={28} theme={t} />
            <button ref={closeRef} onClick={() => setOpen(false)} aria-label="Close menu" style={{ color: page.brand.text, fontSize: 26, lineHeight: 1 }}>×</button>
          </div>
          <nav aria-label="Mobile" className="flex flex-1 flex-col gap-1 overflow-y-auto px-6 py-4">
            {nav.primary.map((l) => (
              <Link key={l.href} href={l.href} className="border-b py-3 text-base" style={{ borderColor: t.line }} onClick={() => setOpen(false)}>{l.label}</Link>
            ))}
            <a href={tel} className="py-3 text-base font-medium" style={{ color: t.secondary }}>{phone}</a>
          </nav>
          {/* single enquiry action inside the menu; the sticky CTA is hidden while
              the menu is open, so there is no competing/duplicate CTA */}
          <div className="border-t px-6 py-4" style={{ borderColor: t.line, paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
            <a href={enquiry} onClick={() => setOpen(false)} style={{ background: t.accent, color: t.onAccent }} className="block rounded-lg px-5 py-3 text-center text-sm font-medium">{nav.enquiryCtaLabel}</a>
          </div>
        </div>
      )}

      {/* ── MAIN ───────────────────────────────────────────────── */}
      <main className="flex-1">{children}</main>

      {/* ── FOOTER (complete, registry-driven) ─────────────────── */}
      <footer style={{ background: t.footer, color: page.brand.text }} className="border-t px-6 py-12" data-vf-footer>
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-4">
          <div>
            <Logo nav={nav} src={nav.logo?.footerSrc ?? nav.logo?.src} height={34} theme={t} />
            <p className="mt-4 text-[12px]" style={{ color: t.text4 }}>{page.nap.address}</p>
            <p className="mt-3 text-sm"><a href={tel} className="hover:underline" style={{ color: t.secondary }}>{phone}</a></p>
            {page.nap.email && <p className="text-sm"><a href={`mailto:${page.nap.email}`} className="hover:underline" style={{ color: t.secondary }}>{page.nap.email}</a></p>}
            {nav.social && nav.social.length > 0 && (
              <ul className="mt-3 flex list-none gap-3 p-0">
                {nav.social.map((s) => <li key={s.href}><a href={s.href} className="text-[12px]" style={{ color: t.text4 }}>{s.label}</a></li>)}
              </ul>
            )}
          </div>
          {nav.footer.map((col) => (
            <div key={col.heading}>
              <p className="text-sm font-medium" style={{ color: t.secondary }}>{col.heading}</p>
              <ul className="mt-3 list-none space-y-2 p-0">
                {col.links.map((l) => <li key={l.href}><Link href={l.href} className="text-sm opacity-75 hover:opacity-100">{l.label}</Link></li>)}
              </ul>
            </div>
          ))}
          <div>
            <a href={enquiry} style={{ background: t.accent, color: t.onAccent }} className="inline-block rounded-lg px-5 py-3 text-sm font-medium">{nav.enquiryCtaLabel}</a>
            {nav.legalLinks && nav.legalLinks.length > 0 && (
              <ul className="mt-6 list-none space-y-2 p-0">
                {nav.legalLinks.map((l) => <li key={l.href}><Link href={l.href} className="text-[12px] hover:underline" style={{ color: t.text4 }}>{l.label}</Link></li>)}
              </ul>
            )}
            <p className="mt-6 text-[12px]" style={{ color: t.text5 }}>{nav.companyReg}</p>
          </div>
        </div>
      </footer>

      {/* ── STICKY CTA (single, governed) ──────────────────────── */}
      {/* Reserve bottom space so the sticky never obscures the footer/legal, and
          HIDE it while the mobile nav is open (no competing/duplicate CTA). */}
      {!open && (
        <>
          <div aria-hidden className="md:hidden" style={{ height: 'calc(64px + env(safe-area-inset-bottom))' }} />
          <a
            href={enquiry}
            style={{ background: t.accent, color: t.onAccent, paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
            className="fixed inset-x-3 bottom-0 z-30 mb-0 rounded-t-lg px-5 pt-3 text-center text-sm font-medium shadow-lg md:hidden"
          >
            {nav.enquiryCtaLabel}
          </a>
        </>
      )}
    </div>
  );
}
