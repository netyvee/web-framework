// hero (SECTION-LIBRARY §1). v0.2 adds OPTIONAL, additive fields — breadcrumbs,
// quick_answer, trust_chips, cta_secondary, layout:'split'. The default path (none
// of these present, layout unset/'standard') renders BYTE-IDENTICALLY to v0.1.x:
// the base markup below is unchanged and every new element is gated on a field
// that is absent by default (React renders `false &&` as nothing). This is why
// v0.2 is parity-safe for existing pinned pages.
import Image from 'next/image';
import type { PageJson } from '../types';
import { imgSrc, imgAlt } from '../loader';
import { resolveTheme } from '../tokens/theme';

type Crumb = { label: string; href: string };

function TrustChips({ chips, accent }: { chips: string[]; accent: string }) {
  return (
    <ul className="mt-4 flex list-none flex-wrap gap-2 p-0">
      {chips.map((c, i) => (
        <li key={i} className="rounded-full px-3 py-1 text-xs font-medium" style={{ color: accent, background: `${accent}1a`, border: `1px solid ${accent}40` }}>{c}</li>
      ))}
    </ul>
  );
}

function CtaRow({ fields, page }: { fields: any; page: PageJson }) {
  const t = resolveTheme(page.brand);
  const hasSecondary = fields.cta_secondary_label && fields.cta_secondary_url;
  if (!fields.cta_label || !fields.cta_url) return null;
  if (!hasSecondary) {
    // byte-identical to the v0.1.x single-CTA markup
    return (
      <a href={fields.cta_url} style={{ background: page.brand.cta, color: page.brand.bg }}
         className="mt-8 inline-block rounded-lg px-6 py-3 font-medium">{fields.cta_label}</a>
    );
  }
  return (
    <div className="mt-8 flex flex-col gap-4 sm:flex-row">
      <a href={fields.cta_url} style={{ background: page.brand.cta, color: page.brand.bg }} className="inline-block rounded-lg px-6 py-3 font-medium">{fields.cta_label}</a>
      <a href={fields.cta_secondary_url} className="inline-block rounded-lg px-6 py-3 font-medium" style={{ border: `1px solid ${t.text3}`, color: t.text }}>{fields.cta_secondary_label}</a>
    </div>
  );
}

function Breadcrumbs({ crumbs, color }: { crumbs: Crumb[]; color: string }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-xs" style={{ color }}>
      <ol className="flex list-none flex-wrap gap-1 p-0">
        {crumbs.map((c, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden>/</span>}
            {i < crumbs.length - 1 ? <a href={c.href} className="hover:underline">{c.label}</a> : <span aria-current="page">{c.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Hero({ fields, page }: { fields: any; page: PageJson }) {
  const src = imgSrc(fields.image);
  const t = resolveTheme(page.brand);
  const crumbs: Crumb[] = Array.isArray(fields.breadcrumbs) ? fields.breadcrumbs : [];
  const chips: string[] = Array.isArray(fields.trust_chips) ? fields.trust_chips : [];

  // SPLIT variant — new branch (no parity impact; only when layout:'split')
  if (fields.layout === 'split') {
    return (
      <section style={{ background: page.brand.bg, color: page.brand.text }} className="px-6 py-16 md:px-12">
        <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
          <div>
            {crumbs.length > 0 && <Breadcrumbs crumbs={crumbs} color={t.text4} />}
            {fields.overline && <span className="vf-overline" style={{ color: t.accent }}>{fields.overline}</span>}
            <h1 className="mt-3 text-4xl md:text-5xl font-medium leading-tight">{fields.heading}</h1>
            {fields.sub && <p className="mt-4 max-w-xl text-lg opacity-80">{fields.sub}</p>}
            {fields.quick_answer && (
              <div className="mt-4 rounded-r p-4 text-sm" style={{ borderLeft: `2px solid ${t.accent}`, background: t.lineAccent, color: t.text2 }}>{fields.quick_answer}</div>
            )}
            {chips.length > 0 && <TrustChips chips={chips} accent={t.accent} />}
            <CtaRow fields={fields} page={page} />
          </div>
          {src && (
            <div className="overflow-hidden rounded-2xl">
              <Image src={src} alt={imgAlt(fields.image, fields.image_alt)} width={1200} height={628} priority />
            </div>
          )}
        </div>
      </section>
    );
  }

  // STANDARD variant — base markup unchanged from v0.1.x; optional inserts are
  // absent by default → byte-identical default output.
  return (
    <section style={{ background: page.brand.bg, color: page.brand.text }} className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        {crumbs.length > 0 && <Breadcrumbs crumbs={crumbs} color={t.text4} />}
        <h1 className="text-4xl md:text-5xl font-medium leading-tight">{fields.heading}</h1>
        {fields.sub && <p className="mt-4 max-w-2xl text-lg opacity-80">{fields.sub}</p>}
        {fields.quick_answer && (
          <div className="mt-4 max-w-2xl rounded-r p-4 text-sm" style={{ borderLeft: `2px solid ${t.accent}`, background: t.lineAccent, color: t.text2 }}>{fields.quick_answer}</div>
        )}
        {chips.length > 0 && <TrustChips chips={chips} accent={t.accent} />}
        <CtaRow fields={fields} page={page} />
        {src && (
          <div className="mt-10 overflow-hidden rounded-xl">
            <Image src={src} alt={imgAlt(fields.image, fields.image_alt)} width={1200} height={628} priority />
          </div>
        )}
      </div>
    </section>
  );
}
