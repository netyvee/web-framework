# Changelog

## v0.5.2 (2026-07-20) - a 403 is a config problem, not a failed deploy

`deploy-verify.mjs` now names the permissions failure instead of surfacing a bare
GitHub `403 Resource not accessible by integration`, which reads exactly like a failed
deploy and is not one.

Found on the first estate-wide rollout: `vigil-cleaning`'s default workflow token carries
no `deployments` scope, so the job failed on a repository whose deploys were fine. The
message now says what it is and prints the four lines that fix it:

```yaml
permissions:
  contents: read
  deployments: read
```

All five site workflows now declare that block explicitly rather than relying on a
per-repo default nobody reads.

## v0.5.1 (2026-07-20) - lockfile-platform-check gave false positives on every other site

**Fixes a defect in v0.5.0's own new check. No runtime change.**

`lockfile-platform-check.mjs` demanded a `linux-x64` build from **every** platform-specific
package family. Run across the estate before being trusted, it failed **care, staffing,
cleaning and security** — all on `fsevents`, which is macOS-only by nature. It publishes no
Linux build, so its absence is **correct**, and flagging it is a false positive of exactly the
kind this tooling exists to eliminate. Cleaning and security were additionally mis-flagged on
`@unrs/*` through a bad family grouping.

**A gate that cries wolf gets switched off, which is worse than having no gate** — so this was
fixed before the check was wired into any other repository.

**The fix:** a family is only required to carry a Linux build if it carries a **win32** build. A
package that ships a Windows binary essentially always ships a Linux one, so win32-without-linux
is the fingerprint of a lockfile captured on Windows — the actual MAIN-01 failure. A darwin-only
family is left alone.

Re-verified in both directions: still fails `netyvee/main`'s real broken lockfile, and now passes
all five site repositories. That result also confirms the lockfile defect was **unique to
`netyvee/main`** and is not lurking elsewhere in the estate.

## v0.5.0 (2026-07-20) - deploy verification, because a false success shipped

**No runtime change. Nothing renders differently. This release is entirely additive
tooling, and every consumer can adopt it without touching a component.**

### Why this exists

The corporate main-site migration (MAIN-01) was reported to the founder as a successful
deploy with "verified rendering". **All six Vercel deployments for `netyvee/main` had
failed.** The report was wrong, and no check in the estate could have caught it.

The failure was not a lie by any component. The CRM printed `NOT VERIFIED AS RENDERED`
and recorded the run as `deployed_unverified` — exactly as designed. The false success
was assembled at the reporting layer out of weaker evidence:

| What was observed | What it actually proves |
|---|---|
| `git push` succeeded | the remote accepted bytes |
| GitHub Contents API returned 201 | a blob exists |
| a workflow was triggered | a run was queued |
| `npm run build` passed **locally** | it builds on Windows, against the working tree |
| no deployment record was noticed | **nothing** — the check was never run |

None of those is a deploy. Two further defects made the gap invisible:

1. **The local build was run against uncommitted code.** A fix to
   `scripts/content-check.mjs` existed only in the working tree, so the artefact that
   was verified was not the artefact that was published. CI on the pushed commit failed.
2. **CI installed differently from the deploy platform.** The site workflow ran
   `npm install`, which may repair a lockfile; Vercel runs `npm ci`, which may not. The
   lockfile recorded one platform binary (`@next/swc-win32-x64-msvc`) instead of nine,
   because it had been regenerated over an existing Windows `node_modules`. So the
   Linux SWC binary was absent and `next build` died on Vercel — while both the local
   build and a green CI run would have said everything was fine.

### Added

- **`scripts/deploy-verify.mjs`** — the only sanctioned proof that a deploy happened.
  Polls the GitHub deployment status for a sha until it reaches a **terminal** state and
  reads it. Four rules, each bought with a real failure:
  - **absence is failure** — "I saw no deployment" is not "nothing was deployed";
  - **non-terminal is not success** — `queued`/`in_progress` means the answer is not in;
  - **timeout is failure**, never an assumed pass;
  - **render is a separate claim** — `--url` + `--marker` assert the served document,
    and a Vercel SSO login page is rejected rather than grepped (it answers `200`, so a
    naive check passes on the wrong document).

  Notably this needs **no Vercel credentials** — the deployment state is on the GitHub
  API, reachable with the token the CRM already holds. Deploy verification had been
  recorded as blocked on a founder gate; for the deploy-status half, that was wrong.

- **`scripts/lockfile-platform-check.mjs`** — fails a build whose `package-lock.json`
  cannot install on the deploy platform. Groups platform-specific packages into families
  and requires a `linux-x64` member in each. Verified in both directions against the real
  `netyvee/main` lockfiles: it fails the broken one and passes the fixed one.

### Consumer guidance

Install with **`npm ci`, never `npm install`**, in every site's CI. A workflow that lets
npm repair the lockfile is testing a dependency tree the deploy will never receive.

## v0.4.11 (2026-07-20) - parent-company shell support (MAIN-01 / D-092)

**Consumers on v0.4.10 and earlier are unaffected. This release changes nothing for a site
that has a phone and an enquiry funnel; care and staffing render byte-identically.**

- **`Shell` no longer renders a dead phone link or a dead enquiry CTA.** Both anchors were
  emitted unconditionally, because every consumer to date was a division site that always had
  both. The corporate front door (`netyvee/main`, vigilservices.co.uk) has neither: no division
  phone, and no agreed corporate enquiry target. The result was `<a href="tel:"></a>` with an
  empty label, and `<a href="">` - an enquiry button whose href resolves to the current page.
  Both are now guarded on a non-empty value, the same way the footer email link always has been.

  Why this mattered enough to release for: **a dead CTA is worse than no CTA.** It still looks
  like a working conversion path in a screenshot and still satisfies a visual-completion check,
  while converting nobody. It fails silently, which is the failure mode this estate is
  systematically removing.

- **`SiteNav.enquiryCtaLabel` is now OPTIONAL.** Requiring it encoded the assumption that every
  consumer is a division site with a sales funnel. Omitting it, together with an empty
  `nap.enquiry_url`, is now the supported way to express "this site has no enquiry CTA yet".
  This is a type-level widening: every existing consumer still compiles unchanged.

- **Tests:** `tests/shell-parent-company.test.tsx` (7 new; 82 total, was 75). Half assert the new
  corporate behaviour, half assert that division sites did NOT regress - including that the CTA
  still appears in all three governed server-rendered positions.

### Housekeeping, and an honest note about this file

`package.json` was stuck at `0.4.8` while tags ran to `v0.4.10`, so an install pinned to
`#v0.4.10` reported version `0.4.8` in the consumer lockfile. Corrected here: this release bumps
the manifest to match its tag.

**v0.4.9 and v0.4.10 have no entries below and none are invented here.** They shipped without
release notes, along with every tag from v0.3.3 onward - 12 tags against 6 GitHub Releases, which
contradicts `docs/SEMVER-POLICY.md`'s own rule that every tag gets notes. Backfilling them from
memory would be guesswork; they are recorded as a known gap in the CRM under `WF-GOV-01`, to be
reconstructed from their diffs. `docs/SEMVER-POLICY.md`'s compatibility matrix is also stale at
v0.3.0 and does not list staffing, its heaviest consumer.


## v0.4.8 (2026-07-05) — EnquiryFunnel audience-gate step type (route-out) — EOS Q1.P3 (part 1)
- **`EnquiryFunnel` gains an opt-in `audience` step type** — a front-of-funnel gate that splits by
  visitor type so a candidate is never carried into the client-sales funnel. Options with a new
  additive `route_to` field are the "route-out" branch (rendered as a governed native `<a href>` —
  e.g. jobseeker → recruitment/careers destination); options without `route_to` are the "continue"
  branch (a `<button>` that advances the funnel as before, e.g. client → next step). Purely additive:
  the existing `choice` step type and its `radiogroup`/bottom-CTA render are byte-unchanged, so pinned
  consumers (Care) and staffing's current choice-only funnel are unaffected.
- **a11y:** the audience step is a `role="group"` (labelled by the question), NOT a `radiogroup` —
  nothing is "selected"; one option navigates away immediately. Route-out options are keyboard-native
  anchors; the continue option is a keyboard-native button. The bottom client-enquiry CTA is suppressed
  while the audience gate is shown, so there is no way to slip past the gate into the client CTA.
- **Attribution/analytics:** choosing a route-out branch emits `FUNNEL_EVENTS.audience`
  (`vigil:funnel_audience`, detail `{ division, source, stepId, value, route_to }`) before the anchor
  hands off. Choosing the continue branch records intent (e.g. `audience=client`) and advances as normal.
- **Contract + validation:** `FunnelOption.route_to?` and `FunnelStep.type: 'choice' | 'audience'` added
  to `conversion/funnel.ts`; `validateFunnel()` now requires an audience step to genuinely split
  (>=1 route-out option AND >=1 continue option). The **server-side audience guard STAYS in the CRM**
  (no CRM PHP enters the frontend package) — this is only the client-side front-of-funnel split.
- 11 new vitest tests (`tests/funnel.test.tsx`): validation accept/reject + backward-compat + static
  render of the route-out anchor, the group semantics, and the suppressed bottom CTA. Gates GREEN:
  typecheck clean · vitest **71/71** (was 60) · src isolation **35 files OK**. No new dependency.
  Q1.P3 part 2 (the `nav.logo.darkSrc` surface-aware pick — screenshot-gated) remains a follow-up unit.

## v0.4.7 (2026-07-04) — shared Next security-headers helper (config tool; no src change) — EOS Q1.P2
- **`config/security.mjs` — `withVigilSecurity(nextConfig)` + `vigilSecurityHeaders()` + `vigilCsp()`.**
  Promoted from `staffing/next.config.mjs` so Care + every future framework site inherits ONE
  security-header set (CSP + HSTS + X-Frame-Options + nosniff + Referrer-Policy + Permissions-Policy +
  X-DNS-Prefetch-Control) instead of copying it — the config analog of the `scripts/perf-budget.mjs`
  and `a11y/*.mjs` promotions.
- **Ships as `.mjs`, NOT `.ts`:** `next.config.mjs` is loaded by Node's own module loader, which does
  not strip TS types under `node_modules` (same rule as `scripts/*.mjs` / `a11y/*.mjs`). Lives in the
  new `config/` package dir (added to `files`), outside the `--mode src` isolation scan. The only
  external hosts named are cross-division shared infra (the CRM enquiry origin + Cloudinary store) —
  never a division identity.
- **CSP is production-strict:** `'unsafe-eval'` is added ONLY when `NODE_ENV !== 'production'` (Next dev
  HMR); `next build`/`next start` never evals. Host lists are tunable (`imgHosts`/`formActions`/
  `connectHosts`, de-duplicated). `withVigilSecurity` preserves any `headers()` the consumer already
  defined (merged after the `/:path*` security rule). No `src/` change — pinned consumers (Care) are
  byte-unaffected. Typecheck + tests + src isolation green.

## v0.4.6 (2026-07-04) — shared §14 a11y journey suite (test harness; no src change) — EOS Q1.P1
- **`a11y/` — 10 shared WCAG 2.2 AA Playwright journeys** (skip-link/landmarks, keyboard nav,
  mobile-menu focus, service-page focus, 320px reflow, 200% zoom, enquiry-funnel a11y, reduced
  motion, interior-page Axe, target-size). Promoted from `staffing/tests/a11y/*` so Care + every
  future framework site inherits ONE a11y harness instead of copying it — the a11y analog of the
  `scripts/perf-budget.mjs` promotion. Ships in the package `files` (`a11y`).
- **Division-agnostic by construction:** the specs assert only the framework's structural contract
  (roles, `aria-*`, `main#main-content`, `aria-label="Enquiry progress"`, `vf-mobile-nav`) — ZERO
  identity literals. Interior render paths are supplied by the consuming site via
  `A11Y_SERVICE_PATH` / `A11Y_LOCATION_PATH` / `A11Y_ARTICLE_PATH` (see `a11y/_routes.ts` + README,
  default `/`). The enquiry-funnel journey was genericised off staffing step-copy onto the
  framework's emitted funnel structure and now drives to completion through any step count.
- The framework carries no Playwright/Axe dependency — the specs import `@playwright/test` +
  `@axe-core/playwright` from the CONSUMING repo (as the shipped `scripts/*.mjs` already do).
  Outside `src/`, `tests/` and the isolation `--mode src` scan — so pinned consumers (Care) are
  byte-unaffected. Typecheck + 54 tests + src isolation green.

## v0.4.5 (2026-07-04) — perf-budget harness (CI tool; no src change) — EOS Q1.P1
- **`scripts/perf-budget.mjs`** — Core Web Vitals budget gate for any framework site. Promoted from
  `staffing/tests/perf/lcp-probe.mjs` so Care + every future site inherits ONE perf harness instead of
  copying it. `BASE_URL`-parameterised: takes a base + route list (`--routes "/,/foo"` or a JSON file),
  drives the consuming repo's already-installed Playwright chromium against a warmed production build,
  reports median LCP/CLS/TTFB/FCP per route, and FAILS (exit 1) on a budget breach unless `--report-only`.
  Budgets configurable (`--lcp 2500 --cls 0.1`); mobile viewport by default. INP flagged, not synthesised.
  No `src/` change — pinned consumers (Care) are byte-unaffected; the tool ships in the package `scripts/`.
  Typecheck + 54 tests + src isolation green.

## v0.4.1 (2026-07-02) — content-completeness gate (CI tool; no src change)
- **`scripts/content-completeness-check.mjs`** — the SUBSTANCE gate for a render-from-JSON site.
  Reads `content/pages/*.json` and hard-blocks: missing/mis-formed canonical (must == slug),
  SEO title/description/focus-keyword bounds, exactly-one-hero (H1), duplicate title/canonical,
  ORPHAN pages (indexable, non-legal, zero internal links), BROKEN internal links, page-type
  contract gaps (commercial pages need structured content + a conversion action; the /blog index
  and locations hub cards must be clickable), and any FOREIGN division phone. Complements
  division-isolation (foreign leakage) + visual-completion (shell). No `src/` change — pinned
  consumers are byte-unaffected; the tool ships in the package `scripts/` for CI.

## v0.4.0 (2026-07-02) — clickable ServiceGrid cards (minor, additive)
For W-STAFFING-CONTENT-AND-ORGANIC-CLOSURE: the organic internal-link architecture needs
clickable card grids (a location hub whose area cards link to their pages, and a blog index whose
article cards link to their posts).

Added:
- **`service_grid` items accept an optional internal `href`** — when present (and leading-slash /
  internal, mirroring the LocationsCoverage CRM gate), the card renders as a `next/link` `Link` with
  a "Learn more →" affordance; otherwise it renders exactly as before. Items **without** `href`
  produce byte-identical markup to v0.3.x, so pinned consumers (Care) are unaffected.
- Tests: +1 (service_grid href link + hrefless parity). Typecheck + 53 tests + src isolation green.

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
