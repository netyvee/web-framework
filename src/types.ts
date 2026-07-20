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
    // SEO-04 item 3 (additive/optional). Consumed ONLY by buildJsonLd()'s Article
    // branch (schema_type==='Article') when present; omitted from output otherwise.
    // The CRM does not export these yet, so every current page leaves them undefined
    // (no-op). ISO 8601 date/datetime strings.
    date_published?: string;
    date_modified?: string;
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
  // CRM-exported per-site settings block (WebExportPages::toArtifact →
  // site_settings). Additive/optional: the framework consumes only what it renders.
  // `social` (platform → profile URL) feeds Organization.sameAs (SEO-04 item 5).
  // PHP serialises an empty map as `[]`, so social may be an object OR an empty array
  // — buildJsonLd() reads only string URL values and omits sameAs when there are none.
  site_settings?: {
    social?: Record<string, string> | string[];
    [key: string]: unknown;
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

// ── Typed link relationship (SM-F2) ──────────────────────────────────────────
// A CLOSED ALLOW-LIST, deliberately not `string`. `rel` exists to carry ONE
// governed relationship — the division→corporate edge of D-095 / founder G-A —
// and a free-form string would let any site declare any relationship it liked,
// which is precisely the thing the governance model refuses. Widening this union
// is a governance change (a D-record), never a typing convenience.
//
// The value is a GOVERNANCE classification, not an HTML link-relation token:
// `corporate_parent` is not registered in the HTML spec, so the Shell renders it
// as `data-vf-rel`, never as a bare `rel=` attribute. See Shell.tsx §nav.
export type NavLinkRel = 'corporate_parent';
export const NAV_LINK_RELS: readonly NavLinkRel[] = ['corporate_parent'] as const;

/**
 * Runtime allow-list guard for the untyped boundary (site-settings JSON exported
 * by the CRM). TypeScript cannot police a parsed JSON value, and the loaders read
 * exactly that — so the same allow-list must exist as a runtime check or the type
 * is decorative. Loaders MUST filter through this rather than copying `rel` across.
 */
export function isNavLinkRel(value: unknown): value is NavLinkRel {
  return typeof value === 'string' && (NAV_LINK_RELS as readonly string[]).includes(value);
}

export type NavLink = { label: string; href: string; rel?: NavLinkRel };
export type FooterColumn = { heading: string; links: NavLink[] };

export type SiteNav = {
  brandName: string;
  primary: NavLink[];
  footer: FooterColumn[];
  companyReg: string;
  // The enquiry CTA button label (shell Footer + MobileCta). Site-owned wording —
  // extracted from the shipped care/staffing shell where it was a literal.
  //
  // OPTIONAL since v0.4.11. It was required, which encoded an assumption that every
  // consumer is a division site with a sales funnel. The parent-company site
  // (netyvee/main, vigilservices.co.uk) is the counter-example: it has no agreed
  // corporate enquiry target, and pointing it at any one division's funnel is a
  // governance breach the CRM already tracks as C-12. Omit this (and leave
  // `nap.enquiry_url` empty) and the Shell renders NO enquiry CTA at all, rather
  // than a button whose href resolves to the current page.
  //
  // Behaviour is unchanged for every existing consumer: care and staffing both set
  // this and both have a non-empty enquiry_url, so their CTA renders exactly as before.
  enquiryCtaLabel?: string;
  // Candidate/careers CTA label used on recruitment page types (optional; defaults to
  // 'Careers & applications'). Keeps candidates out of the client-sales enquiry funnel.
  careersCtaLabel?: string;
  // v0.3 shell v2 (all optional → additive). Brand assets come from the site
  // config/asset contract, NOT component code, so the dashboard can later edit them.
  logo?: { src: string; alt: string; footerSrc?: string };
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
