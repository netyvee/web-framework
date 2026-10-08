'use client';
// @vigil/web-framework — NavBar (F2-B1, netyvee/app#344).
//
// Decomposed out of Shell's §4 (header + accessible mobile nav) so a consumer can
// adopt the shared nav/dropdown/accordion primitive WITHOUT adopting Shell's
// footer, sticky CTA, or body layout — Shell itself now renders this component
// internally, so there is exactly one nav implementation, not two. Named `NavBar`
// (not `Header`) because `./Header` is already the unrelated, still-exported
// legacy v0.2 header component (extracted verbatim from care F1.2) — this is a
// different, newer component, not a replacement for that one.
//
// Minimal props by design: NavBar takes `nav`, `slug` (for aria-current) and
// `brand` (the same Brand shape resolveTheme already takes everywhere — not a
// full PageJson), plus already-resolved phone/CTA strings. All page-type-aware
// business logic (recruitment-page CTA routing, hasPhone/hasCta gating) stays in
// Shell, which computes it once and passes the RESULT down — NavBar itself does
// not know what a recruitment page is.
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { PageJson, SiteNav, NavLink, NavLinkRel } from '../types';
import { resolveTheme } from '../tokens/theme';

// F2-04 correction (netyvee/app#344 comment 6070463685) — the full-screen mobile
// nav dialog previously used `brand.bg` verbatim as its own background. A
// translucent brand.bg is valid and common for a sticky HEADER (especially
// paired with `blur`'s backdrop-filter), but the mobile dialog never received
// that same backdrop-filter — only the header does — so a translucent brand.bg
// left the full-screen dialog translucent too, with nothing compensating: a
// visual evidence review found page content behind the open menu visibly
// bleeding through its own link list. The dialog must stay legible and
// self-contained regardless of what the header's background looks like, so
// this strips any alpha channel from brand.bg for the dialog specifically,
// rather than asking every consumer to configure a second color. A brand.bg
// that is already fully opaque (every existing consumer today) round-trips
// unchanged. `blur`, where enabled, still layers on top of this as a cosmetic
// enhancement — never the only thing standing between the menu and bleed-through.
export function resolveOpaqueSurface(bg: string): string {
  const rgba = bg.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*[\d.]+\s*)?\)$/i);
  if (rgba) return `rgb(${rgba[1]}, ${rgba[2]}, ${rgba[3]})`;
  const hsla = bg.match(/^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+%)\s*,\s*([\d.]+%)\s*(?:,\s*[\d.]+\s*)?\)$/i);
  if (hsla) return `hsl(${hsla[1]}, ${hsla[2]}, ${hsla[3]})`;
  const hex8 = bg.match(/^#([0-9a-f]{6})[0-9a-f]{2}$/i);
  if (hex8) return `#${hex8[1]}`;
  const hex4 = bg.match(/^#([0-9a-f]{3})[0-9a-f]$/i);
  if (hex4) return `#${hex4[1]}`;
  return bg; // already opaque, or a form (named color, var()) with no alpha to strip
}

export function Logo({
  nav,
  src,
  height,
  theme,
  invert,
  wordmark,
  round,
}: {
  nav: SiteNav;
  src?: string;
  height: number;
  theme: { text: string; accent: string };
  // F2-B4 (netyvee/app#344) — some consumers ship a single dark-mark logo asset
  // and rely on CSS to render it light-on-dark (Cleaning's live Nav.tsx does this
  // today). Optional/default-false: every existing caller (Shell, Care, Staffing)
  // omits it and gets the exact same <img>, no filter, as before.
  invert?: boolean;
  // F2-04 (netyvee/app#344) — Cleaning's live Nav.tsx renders the logo image AND a
  // text wordmark side by side; this component previously rendered one OR the
  // other (image when `src` is set, else the bare brandName span), which was the
  // confirmed visual-parity gap blocking Cleaning's nav-framework cutover.
  // Optional/default-false: every existing caller (Shell, Care, Staffing) omits it
  // and gets the exact same image-only (or text-only) output as before. The
  // wordmark's colour is `theme.accent` (== page.brand.cta), not a literal — on
  // Cleaning that resolves to the same #4ecdc4 its live wordmark already uses,
  // because the CRM-exported page JSON already carries that value there.
  wordmark?: boolean;
  // F2-04 (netyvee/app#344) — Cleaning's live Nav.tsx crops its logo image into a
  // circle (`borderRadius: '50%'`); found alongside the wordmark gap while
  // checking render parity for the nav-framework cutover, not a separate
  // capability. Optional/default-false: every existing caller renders the exact
  // same uncropped image as before.
  round?: boolean;
}) {
  const logoSrc = src;
  if (logoSrc) {
    // plain <img> (not next/image) so the logo needs no per-site remotePatterns and
    // renders identically as a repo-static or CDN asset.
    // eslint-disable-next-line @next/next/no-img-element
    const img = (
      <img
        src={logoSrc}
        alt={nav.logo?.alt ?? nav.brandName}
        height={height}
        style={{
          height,
          width: 'auto',
          ...(invert ? { filter: 'brightness(0) invert(1)' } : {}),
          ...(round ? { borderRadius: '50%' } : {}),
        }}
      />
    );
    if (!wordmark) return img;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
        {img}
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: '0.06em',
            color: theme.accent,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          {nav.brandName}
        </span>
      </span>
    );
  }
  return <span className="font-display text-lg font-medium" style={{ color: theme.text }}>{nav.brandName}</span>;
}

// SM-F2 — typed link metadata must survive all the way to the rendered anchor.
// `rel` reached the Shell and was silently discarded here, so a governed
// corporate_parent edge rendered as an anonymous link indistinguishable from any
// other: nothing downstream (Tier 3, a crawler, an auditor) could tell that the
// relationship had been declared at all.
//
// It is emitted as `data-vf-rel`, NOT as `rel`. `corporate_parent` is a governance
// classification of our own; the HTML `rel` attribute takes tokens from a registered
// set, and inventing one there would produce invalid markup whose interpretation by
// crawlers is undefined. `data-*` is the spec's own extension point: valid, inert to
// search engines, and machine-readable for verification — which is exactly the
// contract D-095 asks for (state ownership; do not route authority).
export function relAttrs(l: NavLink): { 'data-vf-rel'?: NavLinkRel } {
  return l.rel ? { 'data-vf-rel': l.rel } : {};
}

function slugify(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// F2-B0 — nested dropdown navigation (netyvee/app FRAMEWORK/IMPLEMENTATION-SEQUENCE.md
// Step 5(b) precondition). A NavLink with `children` renders as a disclosure trigger,
// not a navigating link — see the type's own doc comment in types.ts for why the
// parent `href` is unused here. Desktop: hover opens, click toggles (keyboard/touch
// parity), Escape and click-outside close. Mobile: an accordion under the item,
// independent of other accordions and of the dropdown-open state above it.
//
// F2-B1 — icon/description/columns/footerLink are the Cleaning-parity additions
// (see types.ts's NavLink doc comment for exactly which renders where).

function DesktopNavDropdown({
  link,
  bg,
  line,
  accent,
  slug,
  isOpen,
  onOpen,
  onClose,
  onToggle,
  triggerRef,
  underline,
  chevronIcon,
}: {
  link: NavLink;
  bg: string;
  line: string;
  accent: string;
  slug: string;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onToggle: () => void;
  triggerRef: (el: HTMLButtonElement | null) => void;
  // F2-B4 (netyvee/app#344) — see NavBar's own doc comment on `underline`/`icons`.
  // Both optional/default-off: every existing consumer keeps the exact F2-B1 markup.
  underline?: boolean;
  chevronIcon?: React.ReactNode;
}) {
  const menuId = `vf-dropdown-${slugify(link.label)}`;
  const gridColsClass = link.columns === 2 ? 'grid grid-cols-2 gap-x-4' : 'flex flex-col';
  // Touch devices fire a compatibility mouseenter immediately before their click,
  // so a plain onMouseEnter+onClick pair opens then immediately toggles the menu
  // closed again on tap — it never has a chance to be reached. Pointer events
  // carry a real pointerType; gating hover-open/close on 'mouse' means a touch
  // tap only ever goes through onToggle (a real open, not an open-then-close).
  const onPointerEnter = (e: ReactPointerEvent) => { if (e.pointerType === 'mouse') onOpen(); };
  const onPointerLeave = (e: ReactPointerEvent) => { if (e.pointerType === 'mouse') onClose(); };
  return (
    <div className="relative" onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}>
      <button
        ref={triggerRef}
        type="button"
        onClick={onToggle}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={menuId}
        className={`flex items-center gap-1 text-sm opacity-85 hover:opacity-100 ${underline ? 'group relative pb-1' : ''}`}
      >
        {link.label}
        <span aria-hidden className={`text-[10px] transition-transform ${isOpen ? 'rotate-180' : ''}`}>{chevronIcon ?? '▾'}</span>
        {underline && (
          // F2-B4 — Cleaning's live Nav.tsx grows an underline under the trigger on
          // hover AND while the dropdown is open; a pure-CSS scale transform (no
          // extra JS state) covers hover, and `isOpen` covers the open case via style.
          <span
            aria-hidden
            className="absolute bottom-0 left-0 h-[1.5px] w-full origin-left scale-x-0 rounded-[1px] transition-transform duration-200 group-hover:scale-x-100"
            style={{ background: accent, transform: isOpen ? 'scaleX(1)' : undefined }}
          />
        )}
      </button>
      {isOpen && (
        <div
          id={menuId}
          role="menu"
          aria-label={link.label}
          // top-full with NO margin keeps this panel's own hit-testable box flush
          // against the trigger's — a margin gap here would be dead space no
          // element covers, breaking hover continuity between trigger and menu
          // (the wrapping div's geometric box ends at the button; it does not
          // extend through an empty margin). Visual breathing room comes from
          // p-2 (padding, part of this same box, same 0.5rem as the old
          // margin-top) instead.
          className="absolute left-0 top-full z-20 rounded-lg border border-white/10 p-2 shadow-lg"
          style={{ background: bg, minWidth: link.dropdownMinWidth ?? 200 }}
        >
          <ul className={`m-0 list-none p-0 ${gridColsClass}`}>
            {(link.children ?? []).map((c) => (
              <li key={c.href} role="none">
                <Link
                  href={c.href}
                  role="menuitem"
                  {...relAttrs(c)}
                  aria-current={c.href === slug ? 'page' : undefined}
                  className="flex items-start gap-2 rounded px-3 py-2 text-sm opacity-85 hover:opacity-100 aria-[current=page]:opacity-100 aria-[current=page]:font-medium"
                >
                  {c.icon && <span aria-hidden className="shrink-0">{c.icon}</span>}
                  <span>
                    <span className="block">{c.label}</span>
                    {c.description && <span className="mt-0.5 block text-xs opacity-70">{c.description}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {link.footerLink && (
            // role="none" on the wrapper (matching the pattern each <li role="none">
            // above already uses) neutralizes its structural-div semantics so
            // assistive tech walking this role="menu" container sees only
            // menuitem/none children — not an unlabelled div — and the link itself
            // is a real menuitem, not a plain link a menu-reading AT can skip.
            <div role="none" className="mt-1 border-t pt-2" style={{ borderColor: line }}>
              <Link
                href={link.footerLink.href}
                role="menuitem"
                {...relAttrs(link.footerLink)}
                className="block rounded px-3 py-1.5 text-xs opacity-75 hover:opacity-100"
              >
                {link.footerLink.label}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MobileNavAccordion({
  link,
  slug,
  line,
  isOpen,
  onToggle,
  onNavigate,
  chevronIcon,
}: {
  link: NavLink;
  slug: string;
  line: string;
  isOpen: boolean;
  onToggle: () => void;
  onNavigate: () => void;
  chevronIcon?: React.ReactNode;
}) {
  const panelId = `vf-mobile-accordion-${slugify(link.label)}`;
  return (
    <div className="border-b py-1">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="flex w-full items-center justify-between py-2 text-base"
      >
        {link.label}
        <span aria-hidden className={`text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}>{chevronIcon ?? '▾'}</span>
      </button>
      {isOpen && (
        <div id={panelId} className="py-1 pl-3">
          <ul className="m-0 list-none space-y-1 p-0">
            {(link.children ?? []).map((c) => (
              <li key={c.href}>
                <Link
                  href={c.href}
                  {...relAttrs(c)}
                  aria-current={c.href === slug ? 'page' : undefined}
                  className="flex items-center gap-2 py-2 text-sm opacity-85 aria-[current=page]:opacity-100 aria-[current=page]:font-medium"
                  onClick={onNavigate}
                >
                  {c.icon && <span aria-hidden>{c.icon}</span>}
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
          {(() => {
            // F2-B3 — mobileFooterLink lets the mobile accordion show shorter
            // wording than the desktop dropdown's footerLink; falls back to
            // footerLink when unset (byte-identical for every F2-B1 consumer).
            const mobileFooter = link.mobileFooterLink ?? link.footerLink;
            return mobileFooter && (
              <div className="mt-1 border-t pt-2" style={{ borderColor: line }}>
                <Link
                  href={mobileFooter.href}
                  {...relAttrs(mobileFooter)}
                  className="block py-1.5 text-xs opacity-75"
                  onClick={onNavigate}
                >
                  {mobileFooter.label}
                </Link>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

export function NavBar({
  nav,
  slug,
  brand,
  phone,
  headerCtaHref,
  headerCtaLabel,
  open,
  onOpenChange,
  fixed,
  blur,
  underline,
  logoInvert,
  logoWordmark,
  logoRound,
  headerCtaClassName,
  icons,
}: {
  nav: SiteNav;
  slug: string;
  brand: PageJson['brand'];
  phone?: string;
  headerCtaHref?: string;
  headerCtaLabel?: string;
  // Mobile full-screen menu open state is CONTROLLED by the consumer (Shell),
  // not owned here: Shell needs to know when the menu is open to hide its own
  // sticky CTA underneath it (§5 — no competing/duplicate CTA), a coordination
  // NavBar alone can't do without either duplicating the sticky CTA here too or
  // exposing this same control. Every dropdown/accordion sub-state (which stays
  // purely a NavBar/rendering concern) remains internal, below.
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // F2-B4 (netyvee/app#344) — closes the visual-parity gap found while assessing
  // Cleaning's live Nav.tsx -> NavBar swap: the F2-B1 NavBar reproduced content
  // faithfully but not the bespoke visual treatment Cleaning's design already has
  // live and accepted (fixed+blur header, animated underline, inverted logo,
  // custom glyphs). All five are optional and default to F2-B1's existing
  // behaviour (sticky header, no underline, no invert, ▾/☰/× glyphs) — every
  // current consumer (Shell, Care, Staffing) that doesn't pass them renders
  // byte-identically to before.
  //
  //   • fixed      — `fixed inset-x-0 top-0` instead of `sticky top-0`. Pair with
  //                  a translucent `brand.bg` (e.g. "rgba(10,22,40,0.92)") and
  //                  `blur` for Cleaning's floating-over-content header.
  //   • blur       — backdrop-filter: blur(12px) (+ -webkit- prefix) on the header.
  //   • underline  — an animated bottom underline (in `brand.cta`, i.e. resolved
  //                  theme accent) on desktop flat links (hover + aria-current)
  //                  and dropdown triggers (hover + open).
  //   • logoInvert — forwarded to `Logo`'s own `invert` (brightness(0) invert(1)).
  //   • icons      — override the default ▾ (dropdown/accordion chevron), ☰ (open
  //                  menu) and × (close menu) glyphs with custom nodes. Any subset;
  //                  an omitted key keeps its default glyph.
  //
  // F2-04 (netyvee/app#344) adds two more, same-shape opt-ins, both forwarded
  // straight to Logo's own props of the same name (see Logo's doc comments for
  // why these weren't part of the original F2-B4 set):
  //   • logoWordmark — renders the logo image AND the brandName text together.
  //   • logoRound    — crops the logo image into a circle (borderRadius: 50%).
  //
  // F2-04 also adds `headerCtaClassName`, found while wiring Cleaning's real nav:
  // the header CTA anchor's className was previously hardcoded, so a consumer with
  // its own existing CTA button class (padding/radius/font/hover all already
  // defined there, e.g. Cleaning's `.btn-primary`) could not reuse it without a
  // visible style mismatch against every other CTA on its own site. Optional:
  // omitted, the anchor keeps its exact current hardcoded className (every
  // existing caller — Shell, Care, Staffing, Main — is unaffected). Applied to
  // BOTH the desktop and mobile-menu CTA anchors, replacing their className
  // entirely (not merged) — same pattern as `icons` fully replacing a glyph: the
  // consumer takes full ownership of a string they supply, rather than the
  // framework trying to merge its own defaults with an unknown override.
  fixed?: boolean;
  blur?: boolean;
  underline?: boolean;
  logoInvert?: boolean;
  logoWordmark?: boolean;
  logoRound?: boolean;
  headerCtaClassName?: string;
  icons?: { chevron?: React.ReactNode; menu?: React.ReactNode; close?: React.ReactNode };
}) {
  const t = resolveTheme(brand);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // F2-B0 — desktop dropdown: only one open at a time (keyed by label). Mobile
  // accordions are independent of each other and of the desktop state (a Set,
  // since Cleaning's live nav allows Services and Locations open simultaneously).
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openMobileAccordions, setOpenMobileAccordions] = useState<Set<string>>(new Set());
  // Keyed by link.label (same key as openDropdown) so Escape can restore focus to
  // the trigger a keyboard user was just inside, rather than dropping focus to body.
  const dropdownTriggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Escape closes whichever dropdown is open and returns focus to its trigger —
  // the keyboard-accessibility floor (WAI-ARIA menu-button pattern): a keyboard
  // user who tabbed into the menu and pressed Escape continues from the trigger,
  // not from a focus dropped to document body. Click-outside-to-close is
  // deliberately not implemented: it is notoriously fiddly to combine correctly
  // with the hover-open/click-toggle behaviour below without a state-ordering bug
  // between a capture-phase document listener and the trigger's own bubble-phase
  // onClick, and is not required by the keyboard/ARIA correctness this slice
  // targets — a mouse user closes by hovering elsewhere, and every child is
  // itself a link (activating one navigates away regardless of open state).
  useEffect(() => {
    if (!openDropdown) return;
    const label = openDropdown;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
        dropdownTriggerRefs.current[label]?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openDropdown]);

  // §4 body-scroll-lock + focus management + ESC-to-close
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onOpenChange(false); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
      toggleRef.current?.focus();
    };
  }, [open]);

  const tel = phone ? `tel:${phone.replace(/\s+/g, '')}` : undefined;
  const hasPhone = Boolean(phone);
  const hasHeaderCta = Boolean(headerCtaHref && headerCtaHref.trim() && headerCtaLabel && headerCtaLabel.trim());

  return (
    // Shell already spreads t.cssVars onto its own page-root wrapper, so this is a
    // no-op (redundant, harmless) there — but a consumer using NavBar standalone
    // (F2-B2 is about to be exactly that) would otherwise never set --vf-focus/
    // --vf-accent at all, and tokens.css' focus-ring rules would silently fall back
    // to `currentColor`, which can be invisible against the header/CTA's own text
    // color. Applying it here means NavBar's focus rings are always correct,
    // wherever it's mounted.
    <div style={t.cssVars as React.CSSProperties}>
      <header
        style={{
          background: brand.bg,
          color: brand.text,
          ...(blur ? { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } : {}),
        }}
        className={`${fixed ? 'fixed inset-x-0 top-0' : 'sticky top-0'} z-40 border-b`}
      >
        <div className="border-b" style={{ borderColor: t.line }}>
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 md:py-4">
            <Link href="/" aria-label={nav.brandName} className="flex items-center">
              <Logo nav={nav} src={nav.logo?.src} height={30} theme={t} invert={logoInvert} wordmark={logoWordmark} round={logoRound} />
            </Link>
            <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
              {nav.primary.map((l) =>
                l.children && l.children.length > 0 ? (
                  <DesktopNavDropdown
                    key={l.label}
                    link={l}
                    bg={brand.bg}
                    line={t.line}
                    accent={t.accent}
                    slug={slug}
                    isOpen={openDropdown === l.label}
                    onOpen={() => setOpenDropdown(l.label)}
                    onClose={() => setOpenDropdown((prev) => (prev === l.label ? null : prev))}
                    onToggle={() => setOpenDropdown((prev) => (prev === l.label ? null : l.label))}
                    triggerRef={(el) => { dropdownTriggerRefs.current[l.label] = el; }}
                    underline={underline}
                    chevronIcon={icons?.chevron}
                  />
                ) : (
                  <Link
                    key={l.href}
                    href={l.href}
                    {...relAttrs(l)}
                    aria-current={l.href === slug ? 'page' : undefined}
                    className={`text-sm opacity-85 hover:opacity-100 aria-[current=page]:opacity-100 aria-[current=page]:font-medium ${underline ? 'group relative pb-1' : ''}`}
                  >
                    {l.label}
                    {underline && (
                      <span
                        aria-hidden
                        className="absolute bottom-0 left-0 h-[1.5px] w-full origin-left scale-x-0 rounded-[1px] transition-transform duration-200 group-hover:scale-x-100 group-aria-[current=page]:scale-x-100"
                        style={{ background: t.accent }}
                      />
                    )}
                  </Link>
                )
              )}
              {hasPhone && <a href={tel} className="text-sm font-medium" style={{ color: t.secondary }}>{phone}</a>}
              {hasHeaderCta && <a href={headerCtaHref} style={{ background: t.accent, color: t.onAccent }} className={headerCtaClassName ?? 'rounded-lg px-4 py-2 text-sm font-medium'}>{headerCtaLabel}</a>}
            </nav>
            <button
              ref={toggleRef}
              onClick={() => onOpenChange(true)}
              className="inline-flex items-center justify-center md:hidden"
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="vf-mobile-nav"
              /* display is a CLASS (not inline) so md:hidden can actually hide it — an inline
                 display:inline-flex would override the utility and leak the toggle onto desktop. */
              style={{ color: brand.text, fontSize: 22, lineHeight: 1, minWidth: 44, minHeight: 44 }}
            >{icons?.menu ?? '☰'}</button>
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
          style={{
            background: resolveOpaqueSurface(brand.bg),
            color: brand.text,
            ...(blur ? { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } : {}),
          }}
        >
          <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: t.line }}>
            <Logo nav={nav} src={nav.logo?.src} height={28} theme={t} invert={logoInvert} wordmark={logoWordmark} round={logoRound} />
            <button ref={closeRef} onClick={() => onOpenChange(false)} aria-label="Close menu" style={{ color: brand.text, fontSize: 26, lineHeight: 1 }}>{icons?.close ?? '×'}</button>
          </div>
          <nav aria-label="Mobile" className="flex flex-1 flex-col gap-1 overflow-y-auto px-6 py-4">
            {nav.primary.map((l) =>
              l.children && l.children.length > 0 ? (
                <MobileNavAccordion
                  key={l.label}
                  link={l}
                  slug={slug}
                  line={t.line}
                  isOpen={openMobileAccordions.has(l.label)}
                  onToggle={() =>
                    setOpenMobileAccordions((prev) => {
                      const next = new Set(prev);
                      if (next.has(l.label)) next.delete(l.label); else next.add(l.label);
                      return next;
                    })
                  }
                  onNavigate={() => onOpenChange(false)}
                  chevronIcon={icons?.chevron}
                />
              ) : (
                <Link
                  key={l.href}
                  href={l.href}
                  {...relAttrs(l)}
                  aria-current={l.href === slug ? 'page' : undefined}
                  className="border-b py-3 text-base aria-[current=page]:font-medium"
                  style={{ borderColor: t.line }}
                  onClick={() => onOpenChange(false)}
                >
                  {l.label}
                </Link>
              )
            )}
            {hasPhone && <a href={tel} className="py-3 text-base font-medium" style={{ color: t.secondary }}>{phone}</a>}
          </nav>
          {/* single enquiry action inside the menu; the sticky CTA is hidden while
              the menu is open, so there is no competing/duplicate CTA */}
          {hasHeaderCta && (
            <div className="border-t px-6 py-4" style={{ borderColor: t.line, paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
              <a href={headerCtaHref} onClick={() => onOpenChange(false)} style={{ background: t.accent, color: t.onAccent }} className={headerCtaClassName ?? 'block rounded-lg px-5 py-3 text-center text-sm font-medium'}>{headerCtaLabel}</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
