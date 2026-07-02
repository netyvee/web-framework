// Extracted verbatim from netyvee/care components/shell/MobileCta.tsx — F1.2.
// One change class only: the site-specific CTA label literal became
// nav.enquiryCtaLabel. Markup unchanged for an identical label value.
import type { PageJson, SiteNav } from '../types';

// Sticky mobile enquiry CTA -> the registry enquiry URL.
export function MobileCta({ page, nav }: { page: PageJson; nav: SiteNav }) {
  return (
    <a href={page.nap.enquiry_url}
       style={{ background: page.brand.cta, color: page.brand.bg }}
       className="fixed inset-x-3 bottom-3 z-50 rounded-lg px-5 py-3 text-center text-sm font-medium shadow-lg md:hidden">
      {nav.enquiryCtaLabel} · {page.nap.phone}
    </a>
  );
}
