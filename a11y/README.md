# `@vigil/web-framework/a11y` — shared §14 WCAG 2.2 AA journey suite

Ten deterministic Playwright journeys that prove the **framework Shell + section
library** meet WCAG 2.2 AA — keyboard operation, focus management, landmarks/headings,
reflow/zoom, reduced motion, target size and Axe-clean interior pages. Promoted from
`staffing/tests/a11y/*` (EOS §18, Q1.P1) so **every framework site inherits one a11y
harness** instead of copying it — the a11y analog of `scripts/perf-budget.mjs`.

These specs assert the framework's structural contract only (roles, `aria-*`,
`main#main-content`, `aria-label="Enquiry progress"`, `vf-mobile-nav`, …). They carry
**zero division identity literals** — interior routes and funnel copy are supplied by
the consuming site, so the same specs cover staffing, Care, and every future site.

Shipped as plain **ESM `.mjs`** (like `scripts/perf-budget.mjs`) so a consumer runs them
directly from its `node_modules` pin — Node refuses to strip TypeScript types under
`node_modules`, so a `.ts` harness could not run from a pin.

## The journeys

| Spec | Journey |
|------|---------|
| `skip-link-landmarks.spec.mjs` | J1 — skip link + landmarks + heading order + Axe (home) |
| `keyboard-nav.spec.mjs` | J2 — keyboard-only primary nav, focus ring, no trap (home) |
| `mobile-menu-focus.spec.mjs` | J3 — mobile dialog: keyboard open, focus in, ESC, restore |
| `service-page-focus.spec.mjs` | J4 — focus order + visible focus, interior service page |
| `reflow-320.spec.mjs` | J5 — 320px reflow, no 2-D scroll |
| `zoom-200.spec.mjs` | J6 — 200% zoom (1280→640), nothing clipped |
| `enquiry-form-a11y.spec.mjs` | J7 — funnel: labelled radiogroup, keyboard, progress announce |
| `reduced-motion.spec.mjs` | J8 — `prefers-reduced-motion` honored |
| `interior-axe.spec.mjs` | J10 — landmarks + heading order + Axe on location + article |
| `touch-targets.spec.mjs` | J9 — WCAG 2.5.8 target size on nav + footer contact links |

## Consuming from a site repo (thin wrapper)

The framework carries **no** Playwright/Axe dependency — the specs import
`@playwright/test` + `@axe-core/playwright` from the **consuming** repo (already
installed there), exactly like the shipped `scripts/*.mjs` run downstream.

In the site's `playwright.config.ts`:

```ts
// 1. Declare this site's interior routes (the specs are route-agnostic).
process.env.A11Y_SERVICE_PATH  ??= '/your-service-page';
process.env.A11Y_LOCATION_PATH ??= '/your-location-page';
process.env.A11Y_ARTICLE_PATH  ??= '/your-article';

// 2. Point the a11y projects at the pinned framework copy.
const FRAMEWORK_A11Y = './node_modules/@vigil/web-framework/a11y';
// projects: [{ name: 'desktop', testDir: FRAMEWORK_A11Y, use: desktop }, …]
```

Run against a warmed dev/prod server (the config's `webServer` boots it):

```bash
npx playwright test           # desktop + mobile projects
```

### The interior-route contract (`_routes.mjs`)

| Env var | Used by | Default |
|---------|---------|---------|
| `A11Y_SERVICE_PATH` | service-page-focus, reduced-motion, reflow-320, zoom-200 | `/` |
| `A11Y_LOCATION_PATH` | interior-axe (borough page) | `/` |
| `A11Y_ARTICLE_PATH` | interior-axe (blog article) | `/` |

Unset routes fall back to `/` so the suite still runs (re-testing the homepage) rather
than 404-ing — **set them for real interior coverage.** `BASE_URL` (origin) is honoured
by the site's `playwright.config` `use.baseURL`, same as the perf harness.

## Reference wiring

`netyvee/staffing` (`playwright.config.ts` + `package.json` a11y script) is the
reference consumer. Care adopts on its next framework pin bump (tests-only; no runtime
change — Care stays byte-identical).
