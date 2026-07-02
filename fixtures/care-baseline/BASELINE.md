# CARE BEHAVIOURAL BASELINE (F1.1) — the parity fixture for v0.1.0 adoption
Captured 2026-07-02 from netyvee/care @ 281304b (post S0.5 — the 3 wired D-036
redirects are part of the baseline), built locally with Next.js 14.2.35.
Capture tool: scripts/capture-baseline.mjs. ~95% code similarity is NOT parity
proof — THIS fixture is the proof standard the F1.3 conversion must meet.

## What is captured
- **Routes (10)**: `/` (index), /about-us, /elderly-care, /home-care-companionship,
  /home-care-services, /home-care-support-services-london, /home-help-westminster,
  /respite-care, /services, plus _not-found. (Care grew from 5 to 9 content pages via
  the CRM auto-publish loop — the fixture reflects the TRUE current set.)
- **pages/*.html** — normalized prerendered DOM per route (normalize-html.mjs: scripts
  stripped, hashed /_next/static asset refs neutralised; ALL visible DOM, text,
  attributes, aria, alt, links, inline styles byte-exact).
- **css/** — the single built stylesheet, content-addressed (8,492 bytes).
- **sitemap.xml** — with `<lastmod>` neutralised (the route stamps build time).
- **inventory.json** — per page: title / description / canonical / og:title /
  image count / images-missing-alt (all 0) / own-phone 020 3973 8886 presence
  (true on all 9 content pages).
- **hashes.json** — sha256 per normalized page + CSS content + sitemap.
- **Redirects**: the 3 next.config 301s (/cleaners → /home-care-services,
  /healthcare-staffing-services-2 → /elderly-care, /careers-healthcare-jobs →
  staffing.vigilservices.co.uk/healthcare-assistant-jobs) + trailingSlash:false.
  Redirects are config-level (next.config.mjs), asserted by config equality at F1.3.

## Methodology proof
Two INDEPENDENT builds of identical code+content produced identical normalized hashes
for all 10 pages, the CSS content and the sitemap (0 mismatches) — the normalizer is
build-deterministic, so any post-conversion hash difference is a REAL DOM change, not
build noise.

## Parity standard for F1.3 (and any framework bump flagged DOM-impacting)
normalized-page hashes == baseline (byte-equal) AND css content hash == baseline AND
sitemap == baseline AND division-isolation (built) green. Byte-equal normalized DOM +
byte-equal CSS ⇒ pixel-identical rendering, which is why screenshot references are not
separately required for an engine swap. Content fidelity: content/pages/*.json is
untouched by conversion; the CRM ContentFidelityService gate (netyvee/app) remains the
content-truth authority.

## Honest coverage notes
- **Accessibility**: no axe run exists in the estate; the baseline pins every
  accessibility-relevant DOM attribute (lang, aria-*, alt, semantic tags) byte-exact,
  so adoption cannot regress a11y relative to today. An axe-level audit is a framework
  F1.5+ QA addition (MINIMUM-STANDARD [A]).
- **Responsive breakpoints**: breakpoint behaviour is entirely CSS (`md:` classes) —
  covered by the CSS content hash, not by per-viewport screenshots.
- **Performance**: not baselined (no tooling; [F] in the minimum standard). The engine
  swap ships identical HTML/CSS/JS-shape, so CWV-relevant output is unchanged by
  construction when parity holds.
