# SEMVER POLICY, COMPATIBILITY MATRIX & RELEASE NOTES FORMAT

## Semver policy
- **MAJOR** — anything a consumer must act on: removing/renaming a section type, a
  required SiteConfig/PageJson field change, a rendered-DOM structural change that is
  not opt-in, dropping a supported page-JSON `schema_version`.
- **MINOR** — additive: new section type, new optional field, new exported helper, new
  QA check that is warn-only on introduction.
- **PATCH** — bug fixes with identical contracts and same-or-better output.
- Pre-1.0 note: 0.x still follows the above strictly (we do NOT use the "0.x may break"
  loophole) — consumers are live revenue-adjacent sites.
- The page-JSON content contract is versioned separately by `schema_version`; the
  framework must render schema_version N and N−1 (dropping N−1 = MAJOR).
- Section registry ↔ CRM lockstep: the CRM's config/sections.php is the validation
  mirror. Adding a type here without the CRM knowing is fine (unused); the CRM adding a
  type the framework lacks breaks render — the CRM release note must name the minimum
  framework version.

## Compatibility matrix (updated every release)

> **CORRECTED 2026-07-20 (`WF-GOV-01`).** This matrix had stood at **v0.3.0 marked
> "current"** while tags ran to **v0.4.10** — eight released versions stale — and it
> never listed **staffing**, the heaviest consumer in the estate. A matrix that is
> hand-maintained drifts; the fix is to generate it from consumer lockfiles on every
> release (`WF-GOV-01` policy item 4). Until that generator exists, the rows below are
> reconstructed from real evidence: each consumer's `package.json` pin and the commit
> its `package-lock.json` actually resolved to.

| Framework | schema_version | Next.js | Consumers verified | Status |
|---|---|---|---|---|
| **v0.5.5** | 1 | 14.2.x | **all five sites** — the refusal diagnostic can no longer fail the verification it describes (`process.exit` is not catchable) | ✅ **current** |
| v0.5.4 | 1 | 14.2.x | **all five sites** — a refused deployment exits immediately instead of waiting out the poll timeout | superseded (patch) |
| v0.5.3 | 1 | 14.2.x | **all five sites** — `deploy-verify.mjs` reads the provider's commit status when no deployment exists, so a refusal is diagnosed instead of timing out silently | superseded (patch) |
| v0.5.2 | 1 | 14.2.x | **main · care · staffing · cleaning · security** — `deploy-verify.mjs` names a 403 as a permissions problem rather than surfacing it as a failed deploy | superseded (patch) |
| v0.5.1 | 1 | 14.2.x | **main** — fixes `lockfile-platform-check.mjs` false positives (`fsevents` is macOS-only; darwin-only families are now exempt). Verified against all five site lockfiles | superseded (patch) |
| v0.5.0 | 1 | 14.2.x | **main** — deploy verification: `deploy-verify.mjs` + `lockfile-platform-check.mjs`. No runtime/render change; additive tooling only | superseded (patch) |
| v0.4.11 | 1 | 14.2.x | **main** (`ee38baee`) — parent-company shell: no dead phone link, no dead enquiry CTA; `enquiryCtaLabel` optional | superseded (additive minor) |
| v0.4.10 | 1 | 14.2.x | **staffing** (`e91184bb`) — Article/WebSite/sameAs schema | superseded (additive minor) |
| v0.4.9 | 1 | 14.2.x | — | superseded — **no release notes exist** |
| v0.4.8 | 1 | 14.2.x | — (`package.json` was stuck at this version through v0.4.10) | superseded — **no release notes exist** |
| v0.4.0 – v0.4.7 | 1 | 14.2.x | — | superseded — **no release notes exist** |
| v0.3.3 | 1 | 14.2.x | **care** (`82ef3665`) — 13 commits / 8 versions behind staffing | superseded — **no release notes exist** |
| v0.3.2 · v0.3.1 · v0.3.0 | 1 | 14.2.x | care | superseded (additive minors) |
| v0.2.0 | 1 | 14.2.x | care (archetype rebuild W-FRAMEWORK-V0.2) | superseded (additive minor) |
| v0.1.1 | 1 | 14.2.x | care (F1.3 parity-proven) | superseded (additive minor; identical output for unchanged content) |
| v0.1.0 | 1 | 14.2.x | — | superseded (2 inert artifacts — see CHANGELOG v0.1.1) |

**Not consumers:** `vigil-cleaning` and `security` do not depend on this package at all —
they run a separate `@vigil/ui` + `@vigil/seo` + `@vigil/design` stack. Only 3 of the 5
Vigil site repos consume the framework.

### Known drift, stated plainly rather than left to be rediscovered

- **18 tags, 6 GitHub Releases.** Everything from `v0.3.3` onward (12 tags) shipped with
  **no release notes**, against this document's own rule below. They are marked above
  rather than backfilled from guesswork — reconstructing them honestly means reading
  each diff, which is `WF-GOV-01` work, not something to invent here.
- **`package.json` version lagged its tags.** It sat at `0.4.8` while `v0.4.9` and
  `v0.4.10` were cut, so an install pinned to `#v0.4.10` reported `0.4.8` in the
  consumer lockfile. Corrected at v0.4.11, and the release gate below now prevents it.
- **care is 13 commits / 8 versions behind staffing**, and the drift already costs real
  duplication: `care/next.config.mjs` inlines 55 lines of CSP/HSTS config because its pin
  predates `withVigilSecurity()` (v0.4.7) — with an explanatory comment that cites the
  wrong pin (v0.3.2 vs the actual v0.3.3).

### Release gate (adopted `WF-GOV-01`)

A tag build FAILS if any of these is untrue:
1. `package.json.version` equals the tag — this is exactly how v0.4.9/v0.4.10 shipped mismatched.
2. Release notes exist for the tag.
3. No consumer is more than **2 minor versions** behind (warn at 2, fail at 4).

Reproducible installs are already sound and need no packaging change: npm records the
resolved commit SHA in each consumer's lockfile, so an install is byte-reproducible
regardless of what a tag later points at. **Do not migrate to a package registry** —
the evidence does not support it. Every failure above is process, not packaging.

## Release notes format (every tag gets GitHub release notes)
1. **Version + date + type** (major/minor/patch)
2. **Changes** — per item: what, why, source referent (for extractions: the file it
   came from), contract impact (none/minor/major)
3. **Consumer action required** — exact steps or "none (pin bump only)"
4. **Parity/QA evidence** — what was proven before release (tests, baseline diffs)
5. **Rollback** — confirmed-good previous tag

## Upgrade + rollback procedure (consumer side)
Upgrade: bump pin → `npm install` → `npm run build` → run the site QA gates
(division-isolation + site checks) → parity evidence if the release notes flag DOM
changes → push (one site per commit) → verify deploy. Rollback: revert that commit.
