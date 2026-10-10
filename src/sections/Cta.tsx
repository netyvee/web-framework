// Extracted verbatim from netyvee/care components/sections/Cta.tsx — F1.2.
//
// F2-08 spike (netyvee/app#344): optional `cta_secondary_label`/`cta_secondary_url`,
// mirroring the same additive secondary-CTA pattern Hero's CtaRow already proved
// (v0.2) — a service page's final-CTA section needs both its enquiry CTA and a
// phone `tel:` link, not just one action. Omitted ⇒ byte-identical single-CTA
// markup, unchanged for every existing consumer.
import type { PageJson } from '../types';
import { resolveTheme } from '../tokens/theme';

export function Cta({ fields, page }: { fields: any; page: PageJson }) {
  const t = resolveTheme(page.brand);
  const hasSecondary = fields.cta_secondary_label && fields.cta_secondary_url;
  return (
    <section style={{ background: page.brand.bg, color: page.brand.text }} className="px-6 py-16 text-center">
      <h2 className="text-3xl font-medium">{fields.heading}</h2>
      {fields.sub && <p className="mx-auto mt-3 max-w-2xl opacity-80">{fields.sub}</p>}
      {!hasSecondary ? (
        <a href={fields.cta_url} style={{ background: page.brand.cta, color: page.brand.bg }}
           className="mt-6 inline-block rounded-lg px-6 py-3 font-medium">{fields.cta_label}</a>
      ) : (
        <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a href={fields.cta_url} style={{ background: page.brand.cta, color: page.brand.bg }}
             className="inline-block rounded-lg px-6 py-3 font-medium">{fields.cta_label}</a>
          <a href={fields.cta_secondary_url} className="inline-block rounded-lg px-6 py-3 font-medium"
             style={{ border: `1px solid ${t.text3}`, color: t.text }}>{fields.cta_secondary_label}</a>
        </div>
      )}
    </section>
  );
}
