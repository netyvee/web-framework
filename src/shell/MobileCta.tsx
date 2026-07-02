// Extracted verbatim from netyvee/care components/shell/MobileCta.tsx — F1.2.
// One change class only: the site-specific CTA label literal became
// nav.enquiryCtaLabel. The label+separator render as ONE expression so React's
// text-node boundaries (hydration comments) match the original static-text
// markup byte-for-byte (v0.1.1 parity fix — found by the Care baseline diff).
import type { PageJson, SiteNav } from '../types';

// Sticky mobile enquiry CTA -> the registry enquiry URL.
export function MobileCta({ page, nav }: { page: PageJson; nav: SiteNav }) {
  return (
    <a href={page.nap.enquiry_url}
       style={{ background: page.brand.cta, color: page.brand.bg }}
       className="fixed inset-x-3 bottom-3 z-50 rounded-lg px-5 py-3 text-center text-sm font-medium shadow-lg md:hidden">
      {nav.enquiryCtaLabel + ' · '}{page.nap.phone}
    </a>
  );
}
