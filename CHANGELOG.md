# Changelog

## v0.3.2 (2026-07-02) — Shell skip-to-content link (WCAG 2.4.1 bypass block). Additive.

## v0.3.1 (2026-07-02) — buildPageMetadata OG default (patch)
- `buildPageMetadata(page, { ogImage })` — optional site-default OG image, used when a page has
  no `seo.og_image`, so every page deterministically emits `og:image` (the §2 visual gate).
  Additive; no consumer change required (default `{}` = prior behaviour).

## v0.3.0 (2026-07-02) — shell v2 + visual-completion gates (minor)
The shell-layer completion (the "+9 points" identified in the experience scorecard), for
W-CARE-EXPERIENCE-CLOSURE. **Additive** — the v0.2 Header/Footer/MobileCta are unchanged and
still exported, so pinned sites render identically until they adopt `<Shell>`.

Added:
- **`<Shell page nav>`** — one coordinated client shell resolving the completion requirements the
  separate components could not: header LOGO (from `nav.logo`, a config/asset value — never a
  literal; falls back to brand-name text) · accessible mobile nav (aria-label/expanded/controls,
  visible close (×), ESC-to-close, focus return, body-scroll-lock, single in-menu enquiry action —
  no CTA duplication) · complete registry-driven FOOTER (logo, NAP, columns, legal links, company
  reg, CTA) · ONE governed sticky CTA that is OMITTED from the DOM while the nav is open, has
  safe-area padding, and reserves a bottom spacer so it never obscures the footer/legal.
- **SiteNav** gains optional `logo {src, alt, footerSrc}`, `legalLinks`, `social`, `phoneCtaLabel`
  (additive) — the site config/asset contract the future dashboard edits.
- **`scripts/visual-completion-check.mjs`** — deterministic hard visual-completion gates on built
  output: header-logo · footer-logo · favicon · og-image · single-sticky-cta · footer-clearance ·
  mobile-nav-a11y · responsive-typography (+ advisory footer-legal). Not visual opinion; pixel
  screenshots remain the operator sign-off artifact.
- Tests: +7 (Shell v2). Typecheck + src isolation (34 files) green.

Consumer action: to adopt shell v2, replace `<Header>…<Footer>…<MobileCta>` with
`<Shell page nav>{sections}</Shell>` and supply `nav.logo` (+ optional `legalLinks`/`social`).
Rollback: revert to the individual v0.2 components (still exported) / pin `#v0.2.0`.

## v0.2.0 (2026-07-02) — production section library + tokens + provenance + funnel + SEO (minor)
The experience layer the F1A spec defined, built for real. **Additive minor** — every
new field/type is optional and the default paths of the nucleus components are unchanged,
so pinned consumers render byte-identically (PROVEN: current netyvee/care content on v0.2
= 10/10 pages byte-equal to the F1.1 baseline; CSS containment holds — 0 baseline rules
lost, 2 unreferenced additions).

Added:
- **Design-token module** (`src/tokens/`): `tokens.css` (universal type SCALE + spacing +
  radii + a11y focus + OPT-IN `.vf-typography` layer; font FAMILIES per-site via
  `--vf-font-display/body`) + `theme.ts` (`resolveTheme(brand)` → per-page colours from
  page.brand, `SURFACES` base hierarchy, `surfaceBg`). Colour is per-site/per-page, never a
  component literal (DESIGN-SYSTEM-CONTRACT §4). Typography is registry-configurable font +
  shared scale (V0.2 §4 decision).
- **Provenance enforcement** (`src/provenance.ts`): canonical values
  `migrated·compliance_corrected·framework_enhancement·later_editorial` + `validateProvenance`
  (missing rejected unless legacy-inference, unknown rejected, compliance_corrected requires
  `correction_ref`) + `inferProvenance`. `Section.provenance`/`correction_ref` on the contract.
- **10 library section types**: trust_badge_row, metrics_strip, proof_strip, compliance_strip,
  differentiation_panel, process_steps, quick_answer, locations_coverage, contact_block,
  enquiry_funnel — each themed, responsive, a11y (list/aria/radiogroup semantics), empty-state
  safe, image+alt via the canonical contract.
- **Hero v2** (additive): `layout:'split'`, `trust_chips`, `cta_secondary_*`, `quick_answer`,
  `breadcrumbs`. **Faq v2**: `variant:'accordion'` (client, aria-expanded + region) — default
  `list` unchanged.
- **Conversion funnel contract** (`src/conversion/funnel.ts`) + working minimum EnquiryFunnel
  (choice steps → CRM `/enquire/{division}` hand-off with division + intent + source
  attribution; progress/completion state; window analytics events).
- **SEO / JSON-LD** (`src/seo/`): `buildJsonLd(page, {origin})` (Organization / LocalBusiness /
  Service / FAQPage / BreadcrumbList) + `<JsonLd>` — Cleaning's structured-data strength,
  literal-free, closes Care's missing-JSON-LD gap.
- Tests: 44 (was 14) — provenance, funnel, schema, theme, all library sections + hero/faq v2,
  empty-states, no-foreign-value assertions. Typecheck + src isolation (33 files) green.
- Demo gallery refactored to render the REAL components via the module (proves gallery=production).

Consumer action: bump pin to `#v0.2.0` (additive — no content change required to stay identical).
To ADOPT the experience layer: import `@vigil/web-framework/src/tokens/tokens.css`, set
`--vf-font-*` (next/font), add `class="vf-typography"` to `<body>`, use the new section types.
Rollback: revert the pin to `#v0.1.1` (byte-identical output for existing content).

## v0.1.1 (2026-07-02) — parity patch (found by the Care baseline, F1.3)
- MobileCta: label + separator emitted as ONE expression so React's text-node
  hydration comments match the original static-text markup byte-for-byte. The
  v0.1.0 form (`{label} · {phone}`) inserted one extra invisible `<!-- -->` —
  zero visual/semantic effect, but a byte-parity failure against the baseline.
  Contract impact: none.
- types.ts: a doc comment contained the bare word for Tailwind's position
  utility, which consumer content-scanning turned into an emitted (unused) CSS
  rule; reworded token-free. Contract impact: none.
- Consumer action: pin bump only.
- Parity evidence: with v0.1.1, netyvee/care rebuild = 10/10 normalized pages
  byte-equal to fixtures/care-baseline; CSS = baseline rules all present
  byte-identical + 2 additions (`py-10`, `leading-relaxed`) belonging to the
  Prose section (framework superset), PROVEN unreferenced by any Care page DOM.
- Rollback: v0.1.0 (carries the two artifacts above; visually identical).

## v0.1.0 (2026-07-02) — F1.2 nucleus extraction (extraction ≠ redesign)
The minimum coherent set reproducing the Care site unchanged. Source referents:
- src/loader.ts ← netyvee/care lib/pages/loader.ts (identical in staffing); types
  moved to types.ts, behaviour unchanged. Contract impact: none.
- src/metadata.ts ← the generateMetadata body of care app/[[...slug]]/page.tsx,
  exposed as buildPageMetadata(page). Contract impact: none.
- src/sections/{Hero,ServiceGrid,TextImage,Cta,Faq,Testimonial,ContactForm,
  BoroughBlock}.tsx ← netyvee/care components/sections/* verbatim (imports only).
- src/sections/Prose.tsx ← netyvee/staffing components/sections/Prose.tsx verbatim.
- src/sections/registry.tsx ← care registry + prose (the shipped registries' union);
  adds SECTION_TYPES export. Unknown-type parity guard retained.
- src/shell/{Header,Footer,MobileCta}.tsx ← netyvee/care components/shell/* with
  exactly two change classes: (1) the site-owned `siteNav` import became the `nav:
  SiteNav` prop; (2) the site-specific enquiry CTA label literal became
  nav.enquiryCtaLabel (SiteNav gains the required field). Markup byte-identical for
  identical values. Contract impact: consumers pass `nav` + supply enquiryCtaLabel.
- Zero identity literals in src/ — enforced by CI (`npm run isolation`, 17 files;
  the gate caught + removed one doc-comment example domain during extraction).
- Tests: 14 (loader utilities, all 9 sections incl. unknown-type throw + both image
  shapes, shell NAP-by-construction + no-foreign-value assertion). Typecheck green.
- Consumer action: F1.3 adoption per docs/PUBLISHING.md — pin
  `github:netyvee/web-framework#v0.1.0`, transpilePackages, tailwind content glob
  += './node_modules/@vigil/web-framework/src/**/*.{ts,tsx}', pass nav to shell.
- Parity evidence standard: fixtures/care-baseline (normalized-DOM + CSS hash).
- Rollback: none needed (first release); consumers roll back by reverting the pin.

## v0.1.0-dev.0 (2026-07-02) — F1.0 contracts + repo scaffold
- Repo created (public — consumption-mechanism decision in docs/PUBLISHING.md, D-046).
- Canonical contracts in src/types.ts: PageJson (page_contents-compatible), ImageRef
  (canonical image contract), SiteNav/SiteConfig (navigation/footer/site-identity),
  SectionComponent + registry contract.
- QA utilities: scripts/division-isolation-check.mjs (src + built modes),
  scripts/normalize-html.mjs (parity normalizer).
- Governance docs: PUBLISHING, SEMVER-POLICY (+compatibility matrix + release-notes
  format), CI-STRATEGY.
- No components yet — the nucleus extraction is v0.1.0 (F1.2).
