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
| Framework | page-JSON schema_version | Next.js | Consumers verified | Status |
|---|---|---|---|---|
| v0.3.0 | 1 | 14.2.x | care (shell v2 + visual-completion, W-CARE-EXPERIENCE-CLOSURE) | ✅ current |
| v0.2.0 | 1 | 14.2.x | care (archetype rebuild W-FRAMEWORK-V0.2) | superseded (additive minor) |
| v0.1.1 | 1 | 14.2.x | care (F1.3 parity-proven) | superseded (additive minor; identical output for unchanged content) |
| v0.1.0 | 1 | 14.2.x | — | superseded (2 inert artifacts — see CHANGELOG v0.1.1) |

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
