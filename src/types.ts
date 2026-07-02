// @vigil/web-framework — canonical contracts.
// These types ARE the framework's public interface. Changing a field here is a
// compatibility event (see docs/SEMVER-POLICY.md): additive optional = minor,
// anything else = major.

// ── Page content schema ──────────────────────────────────────────────────────
// Byte-compatible with the JSON the CRM (netyvee/app) exports from page_contents
// via vigil:web-publish-site. The CRM owns validation (SectionSchema +
// PageHealthService); the framework renders what the CRM approved.

export type Section = { type: string; fields: Record<string, any> };

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
};

// ── Site configuration schema ────────────────────────────────────────────────
// The per-site config a consumer repo provides (config/site.ts). Identity VALUES
// originate in the CRM SiteRegistry (config/sites.php) and reach render via the
// page JSON; SiteConfig carries only what the repo itself must know.

export type SiteKey = 'cleaning' | 'security' | 'care_services' | 'care_staffing' | 'main';

export type SiteConfig = {
  site: SiteKey;
  domain: string; // absolute site origin (https://<site-domain>) — sitemap/metadata base
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
