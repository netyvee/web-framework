// differentiation_panel (SECTION-LIBRARY §14). Value-card grid (the "why us"
// section), optional lead image (EEAT split variant).
import Image from 'next/image';
import type { PageJson } from '../types';
import { imgSrc, imgAlt } from '../loader';
import { resolveTheme, surfaceBg, type Surface } from '../tokens/theme';

type Item = { icon?: string; title: string; body: string };

export function DifferentiationPanel({ fields, page }: { fields: any; page: PageJson }) {
  const items: Item[] = Array.isArray(fields?.items) ? fields.items.filter((it: any) => it?.title) : [];
  if (items.length === 0) return null;
  const t = resolveTheme(page.brand);
  const surface: Surface = fields.surface ?? 'default';
  const src = imgSrc(fields.image);
  return (
    <section className="border-b px-6 py-16 md:px-12" style={{ background: surfaceBg(t, surface), color: t.text, borderColor: t.line }}>
      <div className="mx-auto max-w-5xl">
        {fields.overline && <span className="vf-overline" style={{ color: t.accent }}>{fields.overline}</span>}
        {fields.heading && <h2 className="mt-3">{fields.heading}</h2>}
        <div className={`mt-8 grid gap-3 ${src ? 'md:grid-cols-2 md:items-center md:gap-10' : ''}`}>
          {src && (
            <div className="overflow-hidden rounded-2xl">
              <Image src={src} alt={imgAlt(fields.image, fields.image_alt)} width={600} height={400} />
            </div>
          )}
          <ul className="grid list-none gap-3 p-0 md:grid-cols-2" style={src ? { gridTemplateColumns: '1fr' } : undefined}>
            {items.map((it, i) => (
              <li key={i} className="rounded-xl p-5" style={{ background: t.bgCard, border: `1px solid ${t.line}` }}>
                <h3 className="flex items-center gap-2 text-sm font-medium">
                  {it.icon && <span aria-hidden style={{ color: t.accent }}>{it.icon}</span>}
                  {it.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed" style={{ color: t.text3 }}>{it.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
