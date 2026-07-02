# CARE v0.2 ADOPTION EVIDENCE — homepage rebuilt through the division-homepage archetype
Date: 2026-07-02 (W-FRAMEWORK-V0.2 §8/§9). Care pins `@vigil/web-framework#v0.2.0`.

## What changed
- Care homepage REBUILT through the division-homepage archetype (PAGE-ARCHETYPES §1) in the
  CRM source of truth (`CarePilotSeeder::homepageSections()`), exported to
  `netyvee/care/content/pages/index.json`. 14 sections: **6 migrated** (all copy verbatim
  from the recorded live source) + **8 framework_enhancement** (labelled; composed only from
  Care's permitted claims + NAP; `metrics_strip` OMITTED — no verified Care metric, qualitative
  trust used instead per §8 "no fabricated stats").
- Care adopted the design tokens site-wide: `tokens.css` import + `.vf-typography` + DM Sans /
  Playfair via `next/font` (layout/globals). Content is preserved everywhere; only typography +
  composition changed (a design-layer adoption, not a content edit — ContentFidelity stays green).
- Route adds `<JsonLd>` (Organization / LocalBusiness / Service / FAQPage) — Care had none before.

## Adoption gates (all pass)
| Gate | Result |
|---|---|
| Content-preservation | 18/18 migrated copy fragments present in the built homepage (verbatim) |
| CRM ContentFidelity (verbatim gate) | GREEN — migrated sections verbatim; enhancement sections exempt by provenance (masquerade blocked) |
| Provenance | every section labelled (`migrated` / `framework_enhancement`); validated |
| Approved archetype | division-homepage archetype, required-section coverage met |
| Design-token compliance | tokens.css + `.vf-typography` + per-site fonts; no colour literals |
| Conversion standard | hero cta pair + enquiry_funnel (division/intent attribution) + mid + final CTA — not a single button |
| SEO / schema | JSON-LD added (was absent); AEO quick_answer; metadata/canonical/sitemap unchanged |
| Image + a11y | 6 images, 0 missing alt; focus-visible system + faq accordion aria + semantic lists |
| Division isolation (built) | CLEAN — 10 pages, own domain care.vigilservices.co.uk, zero foreign phone/domain |
| NAP | phone 020 3973 8886 present on the homepage; by construction from page.nap |
| Build | `next build` GREEN |
| Experience score | CA-0 36 → CA-1 **71/100** (FRAMEWORK/EXPERIENCE-SCORECARD.md) |

## Additive-parity (other Care pages)
The 9 non-homepage Care pages keep their content verbatim (their seeder entries were untouched);
they gain only the shared typography/tokens (design adoption). Current-content additive-parity on
v0.2 was proven byte-equal before the rebuild (10/10 pages; CSS containment) — see the framework
v0.2.0 CHANGELOG.

## The five adoption flags (§9)
1. Package consumed — **YES** (pinned v0.2.0, builds).
2. Rendering parity (for unchanged content) — **YES** (additive-parity proven).
3. Experience-framework adopted — **YES** (archetype + tokens + conversion + SEO; score 71).
4. Sign-off preview ready — **YES** (build green, gates pass; this fixture is the reference).
5. Operator visually approved — **PENDING** (operator-owned, §7). Live domain still serves
   WordPress; the Vercel build is the preview.

## Rollback
Revert the care adoption commit (pin → v0.1.1, index.json + layout/globals/route restored) and the
CRM seeder commit; byte-identical prior state returns.
