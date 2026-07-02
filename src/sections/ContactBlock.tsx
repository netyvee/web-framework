// contact_block (SECTION-LIBRARY §20). Phone + email from page.nap (never a
// literal), optional hours + enquiry CTA. Distinct from contact_form (which is
// the funnel hand-off block); this is a lightweight contact panel.
import type { PageJson } from '../types';
import { resolveTheme, surfaceBg, type Surface } from '../tokens/theme';

export function ContactBlock({ fields, page }: { fields: any; page: PageJson }) {
  const t = resolveTheme(page.brand);
  const surface: Surface = fields.surface ?? 'alt';
  const { phone, email, enquiry_url } = page.nap;
  return (
    <section className="px-6 py-16 text-center md:px-12" style={{ background: surfaceBg(t, surface), color: t.text }}>
      <div className="mx-auto max-w-3xl">
        <h2>{fields.heading ?? 'Talk to us'}</h2>
        {fields.heading_sub && <p className="mt-2" style={{ color: t.text3 }}>{fields.heading_sub}</p>}
        <p className="mt-3" style={{ color: t.text3 }}>
          Call{' '}
          <a href={`tel:${phone.replace(/\s+/g, '')}`} style={{ color: t.secondary }}>{phone}</a>
          {email && (
            <>
              {' '}or email{' '}
              <a href={`mailto:${email}`} style={{ color: t.secondary }}>{email}</a>
            </>
          )}
        </p>
        {fields.hours && <p className="mt-1 text-xs" style={{ color: t.text5 }}>{fields.hours}</p>}
        <a href={enquiry_url} className="mt-6 inline-block rounded-lg px-6 py-3 font-medium" style={{ background: t.accent, color: t.onAccent }}>
          {fields.cta_label ?? 'Make an enquiry'}
        </a>
      </div>
    </section>
  );
}
