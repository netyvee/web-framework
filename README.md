# @vigil/web-framework

The versioned website framework for the Vigil division sites (Option A1,
netyvee/app FRAMEWORK/ARCHITECTURE-OPTIONS.md, D-045/D-046): the render-from-JSON
engine, typed section components, registry-driven shell, canonical contracts and QA
utilities that every Vigil site consumes as a **pinned git-tag dependency**.

- **Consume**: `"@vigil/web-framework": "github:netyvee/web-framework#vX.Y.Z"` +
  `transpilePackages: ['@vigil/web-framework']` — see docs/PUBLISHING.md.
- **Contracts**: src/types.ts (PageJson, ImageRef, SiteNav, SiteConfig, section
  registry) — the CRM (netyvee/app) exports content that satisfies PageJson; the
  framework renders it inside the shell.
- **Identity-blank by construction**: framework source carries ZERO division phone/
  domain/trading-name literals — CI-enforced (`npm run isolation`). NAP reaches render
  only via the page JSON `nap` block; nav structure via the consumer's SiteConfig.
- **Versioning**: strict semver from v0.1.0 (docs/SEMVER-POLICY.md — compatibility
  matrix, release-notes format, upgrade/rollback, emergency-fix propagation).
- **Testing**: docs/CI-STRATEGY.md — framework render tests + src isolation here;
  built-output isolation + parity-vs-baseline in each consumer.
- **Parity fixtures**: fixtures/<site>-baseline/ hold the normalized-DOM baselines
  captured before each site's adoption (scripts/normalize-html.mjs).

Extraction provenance: the engine originates from netyvee/care (proven live, D-033/
D-037), with the Prose section from netyvee/staffing. Source referents are recorded
per file in CHANGELOG.md. Extraction ≠ redesign: v0.1.0 reproduces the Care site
byte-identically (normalized DOM) — proven in fixtures + the F1.3 adoption evidence.

Governance home: netyvee/app FRAMEWORK/ + ENGINEERING-OS/. Minimum standard:
FRAMEWORK/MINIMUM-STANDARD.md v1.0.0.
