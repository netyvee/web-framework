// Extracted verbatim from netyvee/care components/sections/ContactForm.tsx — F1.2.
// Capture wired by construction: links to the hardened CRM funnel /enquire/{division}
// (proven in CRM Phase 1). NAP phone comes from the page (registry) — never hard-coded,
// so a cross-division number can never appear.
import type { PageJson } from '../types';
import { primaryCtaHref, isRecruitmentPage } from '../cta';

export function ContactForm({ fields, page }: { fields: any; page: PageJson }) {
  // Recruitment/candidate pages hand off to the careers funnel (not client sales), with
  // candidate wording. Non-recruitment output is byte-identical to before.
  const recruitment = isRecruitmentPage(page);
  return (
    <section style={{ background: page.brand.bg, color: page.brand.text }} className="px-6 py-16 text-center">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-3xl font-medium">{fields.heading ?? 'Get in touch'}</h2>
        <p className="mt-3 opacity-80">
          Call <a href={`tel:${page.nap.phone.replace(/\s+/g, '')}`} className="underline" style={{ color: page.brand.secondary }}>{page.nap.phone}</a> {recruitment ? 'or apply to join.' : 'or send an enquiry.'}
        </p>
        <a href={primaryCtaHref(page)} style={{ background: page.brand.cta, color: page.brand.bg }}
           data-division={fields.division} className="mt-6 inline-block rounded-lg px-6 py-3 font-medium">
          {recruitment ? 'Apply now' : 'Send an enquiry'}
        </a>
      </div>
    </section>
  );
}
