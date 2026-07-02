# CROSS-REPO CI TEST STRATEGY

Two layers, one contract:

## 1. Framework CI (this repo, .github/workflows/ci.yml — every push/PR)
- `tsc --noEmit` — the contracts compile.
- `vitest run` — component render tests: every section component + shell rendered via
  react-dom/server against fixture PageJson; asserts the rendered markup carries the
  fixture's NAP/brand values and nothing else.
- **Division-isolation (src mode)** — `scripts/division-isolation-check.mjs --mode src`
  scans src/ for ANY division literal (all 4 phones in all forms, all 4 division
  domains, all 4 trading names). The framework must be identity-blank; a literal is a
  build-breaking failure. This is the "zero site-specific literals" rule made
  enforceable.
- Parity fixtures (fixtures/care-baseline/) are DATA for consumer verification, not
  executed here.

## 2. Consumer contract tests (each site repo's CI)
- `next build` green with the pinned framework (the transpile+contract smoke).
- **Division-isolation (built mode)** — the same script, `--mode built`, scans the
  prerendered HTML for FOREIGN phones/domains (own site config supplies the lists).
  Already wired in cleaning + security seo-check.yml (vendored copy until they consume
  the package) and in care's qa.yml (F1.3).
- Site-specific gates stay site-owned: seo-integrity-check (old gen), CRM PageHealth +
  ContentFidelity (content, gate lives in netyvee/app), funnel e2e (cleaning/security).
- Adoption-time (not every push): normalized-DOM parity vs the stored baseline
  (scripts/normalize-html.mjs) — run when bumping a framework version whose release
  notes flag DOM impact, and always at first adoption.

## Contract seam
The framework promises: same PageJson in → same DOM out, for every released tag, with
zero identity literals of its own. Consumers promise: pinned versions, gates in CI, one
site per bump. The CRM promises: only PageHealth-green content is exported.
