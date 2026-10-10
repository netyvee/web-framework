// case_study (new, F2-08 spike — netyvee/app#344). A service page's optional
// case-study section (ServicePageData.CaseStudy: title + challenge/solution/
// result labelled narrative, optional sector/borough/image, optional
// `anonymous` flag) has no equivalent in the existing section library —
// `testimonial` is a flat quote/author pull-quote, not a labelled three-part
// narrative, and forcing the content into that shape would lose the
// Challenge/Solution/Result structure. This is the one genuinely new section
// type the F2-08 capability review found (every other service-page element
// mapped onto an existing section, additively extended at most).
import Image from 'next/image';
import type { PageJson } from '../types';
import { imgSrc, imgAlt } from '../loader';
import { resolveTheme, surfaceBg, type Surface } from '../tokens/theme';

export function CaseStudy({ fields, page }: { fields: any; page: PageJson }) {
  if (!fields?.title) return null;
  const t = resolveTheme(page.brand);
  const surface: Surface = fields.surface ?? 'default';
  const src = imgSrc(fields.image);
  const parts: [string, string][] = (['challenge', 'solution', 'result'] as const)
    .map((k) => [k[0].toUpperCase() + k.slice(1), fields[k]])
    .filter(([, v]) => !!v) as [string, string][];

  return (
    <section aria-label="Case study" className="px-6 py-16 md:px-12" style={{ background: surfaceBg(t, surface), color: t.text }}>
      <div className="mx-auto grid max-w-5xl items-start gap-10 rounded-2xl p-8 md:grid-cols-2" style={{ background: t.bgCard, border: `1px solid ${t.line}` }}>
        {src && (
          <div className="overflow-hidden rounded-xl">
            <Image src={src} alt={imgAlt(fields.image, fields.image_alt)} width={600} height={400} />
          </div>
        )}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{fields.title}</h3>
          {parts.map(([label, text]) => (
            <div key={label}>
              <p className="text-xs font-medium uppercase tracking-widest" style={{ color: t.accent }}>{label}</p>
              <p className="text-sm" style={{ color: t.text3 }}>{text}</p>
            </div>
          ))}
          {(fields.sector || fields.borough) && (
            <p className="text-xs" style={{ color: t.text4 }}>
              {[fields.sector, fields.borough].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
