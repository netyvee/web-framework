# Changelog

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
