// Extracted verbatim from netyvee/care components/sections/ContactForm.tsx — F1.2.
// Capture wired by construction: links to the hardened CRM funnel /enquire/{division}
// (proven in CRM Phase 1). NAP phone comes from the page (registry) — never hard-coded,
// so a cross-division number can never appear.
import type { PageJson } from '../types';

export function ContactForm({ fields, page }: { fields: any; page: PageJson }) {
  return (
    <section style={{ background: page.brand.bg, color: page.brand.text }} className="px-6 py-16 text-center">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-3xl font-medium">{fields.heading ?? 'Get in touch'}</h2>
        <p className="mt-3 opacity-80">
          Call <a href={`tel:${page.nap.phone.replace(/\s+/g, '')}`} style={{ color: page.brand.secondary }}>{page.nap.phone}</a> or send an enquiry.
        </p>
        <a href={page.nap.enquiry_url} style={{ background: page.brand.cta, color: page.brand.bg }}
           data-division={fields.division} className="mt-6 inline-block rounded-lg px-6 py-3 font-medium">
          Send an enquiry
        </a>
      </div>
    </section>
  );
}
