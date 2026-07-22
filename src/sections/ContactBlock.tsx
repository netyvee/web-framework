// contact_block (SECTION-LIBRARY §20). Phone + email from page.nap (never a
// literal), optional hours + enquiry CTA. Distinct from contact_form (which is
// the funnel hand-off block); this is a lightweight contact panel.
import type { PageJson } from '../types';
import { resolveTheme, surfaceBg, type Surface } from '../tokens/theme';
import { primaryCtaHref, isRecruitmentPage } from '../cta';

export function ContactBlock({ fields, page }: { fields: any; page: PageJson }) {
  const t = resolveTheme(page.brand);
  const surface: Surface = fields.surface ?? 'alt';
  const { phone, email } = page.nap;
  // v0.6.2 — guard dead contact affordances (same philosophy as the Shell's v0.4.11 dead-phone/CTA
  // guard): a phone-less corporate site (M-14) must NOT render an empty `tel:` link, and a site with
  // no enquiry funnel (C-12, empty enquiry_url) must NOT render a dead CTA button. Byte-identical for
  // consumers that DO have a phone + email + CTA (care, staffing).
  const hasPhone = typeof phone === 'string' && phone.trim() !== '';
  const hasEmail = typeof email === 'string' && email.trim() !== '';
  // Recruitment/candidate pages route to the careers funnel; non-recruitment is unchanged.
  const ctaHref = primaryCtaHref(page);
  const hasCta = typeof ctaHref === 'string' && ctaHref.trim() !== '';
  const ctaLabel = fields.cta_label ?? (isRecruitmentPage(page) ? 'Apply now' : 'Make an enquiry');
  return (
    <section className="px-6 py-16 text-center md:px-12" style={{ background: surfaceBg(t, surface), color: t.text }}>
      <div className="mx-auto max-w-3xl">
        <h2>{fields.heading ?? 'Talk to us'}</h2>
        {fields.heading_sub && <p className="mt-2" style={{ color: t.text3 }}>{fields.heading_sub}</p>}
        {(hasPhone || hasEmail) && (
          <p className="mt-3" style={{ color: t.text3 }}>
            {hasPhone && (
              <>Call{' '}<a href={`tel:${phone.replace(/\s+/g, '')}`} className="underline" style={{ color: t.secondary }}>{phone}</a></>
            )}
            {hasPhone && hasEmail && <>{' '}or email{' '}</>}
            {!hasPhone && hasEmail && <>Email{' '}</>}
            {hasEmail && (
              <a href={`mailto:${email}`} className="underline" style={{ color: t.secondary }}>{email}</a>
            )}
          </p>
        )}
        {fields.hours && <p className="mt-1 text-xs" style={{ color: t.text5 }}>{fields.hours}</p>}
        {hasCta && (
          <a href={ctaHref} className="mt-6 inline-block rounded-lg px-6 py-3 font-medium" style={{ background: t.accent, color: t.onAccent }}>
            {ctaLabel}
          </a>
        )}
      </div>
    </section>
  );
}
