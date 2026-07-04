// @vigil/web-framework — canonical contracts.
// These types ARE the framework's public interface. Changing a field here is a
// compatibility event (see docs/SEMVER-POLICY.md): additive optional = minor,
// anything else = major.

// ── Page content schema ──────────────────────────────────────────────────────
// Byte-compatible with the JSON the CRM (netyvee/app) exports from page_contents
// via vigil:web-publish-site. The CRM owns validation (SectionSchema +
// PageHealthService); the framework renders what the CRM approved.

// provenance: CONTENT-PROVENANCE-POLICY.md (netyvee/app FRAMEWORK/) — every section
// declares how its content originated. Canonical values + validation live in
// ./provenance (single source; W-FRAMEWORK-V0.2 §1 fixed the value set). Optional
// at the RENDER layer (the framework renders regardless); REQUIRED + enforced at
// the CRM gate (SectionSchema) and by validateProvenance() for exported content.
export type { SectionProvenance } from './provenance';
import type { SectionProvenance as _SectionProvenance } from './provenance';

export type Section = {
  type: string;
  fields: Record<string, any>;
  provenance?: _SectionProvenance;
  // compliance_corrected sections cite their correction record (D-036 mechanism).
  correction_ref?: string;
};

export type PageJson = {
  schema_version: number;
  site: string;
  slug: string;
  page_type: string;
  status?: string;
  seo: {
    title: string;
    description: string;
    canonical: string;
    focus_keyword?: string;
    schema_type?: string;
    og_image?: string;
    noindex?: boolean;
  };
  brand: { bg: string; text: string; cta: string; secondary: string };
  nap: {
    phone: string;
    email?: string;
    address?: string;
    trading_name: string;
    enquiry_url: string;
    // Recruitment/candidate funnel (optional, additive). When absent, the shell derives it
    // from enquiry_url (/enquire/{div} -> /careers/{div}) for recruitment page types so
    // candidates are never routed into the client-sales funnel.
    careers_url?: string;
  };
  sections: Section[];
};

// ── Canonical image contract ─────────────────────────────────────────────────
// A slot image is the canonical object {url, alt, id, public_id, source_url,
// source, status} OR a legacy bare URL string. imgSrc/imgAlt (loader.ts) read
// either shape so render never breaks on the shape. Mirrors App\Support\Web\
// ImageRef in the CRM.

export type ImageRef =
  | string
  | {
      url?: string;
      alt?: string;
      id?: number;
      public_id?: string;
      source_url?: string;
      source?: string;
      status?: string;
    }
  | null
  | undefined;

// ── Navigation / footer / site-identity contracts ────────────────────────────
// NAP (phone/email/address/trading_name/enquiry_url) is NEVER part of SiteNav —
// it comes exclusively from the page JSON `nap` block (registry-sourced), so a
// cross-division value is impossible by construction. SiteNav carries structure
// only. companyReg is the one shared-legal-entity string every footer shows.

export type NavLink = { label: string; href: string };
export type FooterColumn = { heading: string; links: NavLink[] };

export type SiteNav = {
  brandName: string;
  primary: NavLink[];
  footer: FooterColumn[];
  companyReg: string;
  // The enquiry CTA button label (shell Footer + MobileCta). Site-owned wording —
  // extracted from the shipped care/staffing shell where it was a literal.
  enquiryCtaLabel: string;
  // Candidate/careers CTA label used on recruitment page types (optional; defaults to
  // 'Careers & applications'). Keeps candidates out of the client-sales enquiry funnel.
  careersCtaLabel?: string;
  // v0.3 shell v2 (all optional → additive). Brand assets come from the site
  // config/asset contract, NOT component code, so the dashboard can later edit them.
  // Surface-aware convention (v0.4.9): `src` is the default/light-surface logo;
  // `darkSrc` (optional) is the variant tuned for a DARK surface (the navy header/
  // footer) — on a dark surface it is preferred, else `src` is used. `footerSrc` is
  // a footer-slot-specific override that wins in the footer regardless of surface.
  // When `darkSrc` is absent the pick is byte-identical to the pre-v0.4.9 behaviour.
  logo?: { src: string; alt: string; footerSrc?: string; darkSrc?: string };
  legalLinks?: NavLink[];
  social?: { label: string; href: string }[];
  // Secondary sticky/CTA action (e.g. phone) label; if absent the sticky CTA shows
  // the enquiry action only (single governed CTA).
  phoneCtaLabel?: string;
};

// ── Site configuration schema ────────────────────────────────────────────────
// The per-site config a consumer repo provides (config/site.ts). Identity VALUES
// originate in the CRM SiteRegistry (config/sites.php) and reach render via the
// page JSON; SiteConfig carries only what the repo itself must know.

export type SiteKey = 'cleaning' | 'security' | 'care_services' | 'care_staffing' | 'main';

export type SiteConfig = {
  site: SiteKey;
  domain: string; // full https origin of the site — sitemap/metadata base
  // (comment kept token-free: Tailwind content-scanning of the shipped source
  // turns bare utility-name words in comments into emitted CSS rules)
  nav: SiteNav;
};

// ── Section-type registry contract ───────────────────────────────────────────
// The framework registry (sections/registry.tsx) maps section type → component.
// It must stay in LOCKSTEP with the CRM's config/sections.php: the CRM never
// exports a type the framework can't render (PageHealth section_fields rule),
// and the framework fails loudly outside production on an unknown type.
// Adding a type = framework MINOR release; removing/renaming = MAJOR + CRM
// migration note.

export type SectionProps = { fields: any; page: PageJson };
export type SectionComponent = (props: SectionProps) => React.ReactNode;
