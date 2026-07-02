# F1.3 ADOPTION EVIDENCE — netyvee/care on @vigil/web-framework v0.1.1
Date: 2026-07-02. Adoption commit: netyvee/care 72e7cbb (pin
`github:netyvee/web-framework#v0.1.1`, in-repo engine deleted, route/sitemap delegate
to framework exports, tailwind scans the framework source, qa.yml added).

## Parity proof vs the F1.1 baseline (this directory)
- **Pages**: 10/10 normalized prerendered pages BYTE-EQUAL to baseline hashes
  (9 content pages + _not-found).
- **Sitemap**: byte-equal (lastmod-neutralised).
- **CSS**: 0 baseline rules lost or changed; 2 additions (`.py-10`,
  `.leading-relaxed`) from the Prose section (framework superset, consumed by
  Staffing at F1.4), proven referenced 0× in every rendered page's DOM → pixel
  parity by construction (MINIMUM-STANDARD v1.0.1 §6 containment rule).
- **Division isolation (built)**: 10 pages clean — zero foreign phones/domains.
- **Redirects**: next.config redirect block unchanged (the 3 D-036 301s intact).
- **Content fidelity**: content/pages/*.json untouched by the conversion — the CRM
  ContentFidelityService gate is unaffected by construction.
- **Metadata**: buildPageMetadata is the verbatim generateMetadata body; metadata is
  part of the byte-equal page HTML (title/description/canonical/og pinned by hashes).

## The parity gate WORKED (two real catches)
v0.1.0 first produced 9/10 page mismatches + a CSS hash change. Diagnosis:
1. MobileCta's parameterised label changed React text-node boundaries (one extra
   invisible `<!-- -->` hydration comment) — fixed in v0.1.1 (label+separator as one
   expression).
2. A types.ts doc comment word was scanned by consumer Tailwind into an unused CSS
   rule — reworded token-free in v0.1.1.
Neither had any visual/semantic effect; both were caught ONLY because the standard is
byte-level. Care stayed pre-framework until the framework was fixed — exactly the
mandated failure path.

## Deploy verification (2026-07-02)
- netyvee/care QA Gate (GitHub Actions): **success** on 72e7cbb — npm install resolved
  the framework from the public git tag with zero credentials; build + built-mode
  isolation green on the CI runner.
- Vercel deployment for 72e7cbb: **success**
  (care-h9h4hfqwu-vigil-s-projects1.vercel.app).
- NOTE (recorded fact): the production domain care.vigilservices.co.uk still serves
  the OLD WORDPRESS site (wp-json response headers verified) — the domain cutover is
  the operator-owned visual-sign-off step. The framework adoption therefore carried
  ZERO live-revenue risk, and the 3 wired 301s take effect at cutover.

## Rollback
Revert netyvee/care 72e7cbb (pin + engine files restore together); confirmed-good
prior state: 281304b (pre-framework, redirects wired).
