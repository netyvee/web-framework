// Extracted verbatim from netyvee/care components/shell/Footer.tsx — F1.2.
// Two change classes only: the `siteNav` import became the `nav` prop, and the
// site-specific enquiry CTA label literal became nav.enquiryCtaLabel (the consumer
// supplies the identical string → byte-identical output, zero literals here).

import Link from 'next/link';
import type { PageJson, SiteNav } from '../types';

// Footer + division NAP. ALL NAP values come from page.nap (registry-sourced) —
// phone/email/address/trading_name are never literals, so a foreign division's
// number can never appear.
export function Footer({ page, nav }: { page: PageJson; nav: SiteNav }) {
  const b = page.brand;
  const { phone, email, address, trading_name } = page.nap;
  return (
    <footer style={{ background: b.bg, color: b.text }} className="border-t border-white/10 px-6 py-12">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
        <div>
          <p className="font-display text-base font-medium">{trading_name}</p>
          <p className="mt-3 text-[12px] opacity-50">{address}</p>
          <p className="mt-3 text-sm">
            <a href={`tel:${phone.replace(/\s+/g, '')}`} className="hover:underline" style={{ color: b.secondary }}>{phone}</a>
          </p>
          <p className="text-sm">
            <a href={`mailto:${email}`} className="hover:underline" style={{ color: b.secondary }}>{email}</a>
          </p>
        </div>
        {nav.footer.map((col) => (
          <div key={col.heading}>
            <p className="text-sm font-medium" style={{ color: b.secondary }}>{col.heading}</p>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.href}><Link href={l.href} className="text-sm opacity-75 hover:opacity-100">{l.label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <a href={page.nap.enquiry_url} style={{ background: b.cta, color: b.bg }}
             className="inline-block rounded-lg px-5 py-3 text-sm font-medium">{nav.enquiryCtaLabel}</a>
          <p className="mt-6 text-[12px] opacity-40">{nav.companyReg}</p>
        </div>
      </div>
    </footer>
  );
}
