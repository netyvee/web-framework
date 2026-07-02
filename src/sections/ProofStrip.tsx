// proof_strip (SECTION-LIBRARY §12). Positioning/sector strip on a hairline band.
import type { PageJson } from '../types';
import { resolveTheme, surfaceBg, type Surface } from '../tokens/theme';

type Item = { icon?: string; label: string };

export function ProofStrip({ fields, page }: { fields: any; page: PageJson }) {
  // accepts items:[{label}] OR a bare string[] for convenience
  const raw: any[] = Array.isArray(fields?.items) ? fields.items : [];
  const items: Item[] = raw.map((it) => (typeof it === 'string' ? { label: it } : it)).filter((it) => it?.label);
  if (items.length === 0) return null;
  const t = resolveTheme(page.brand);
  const surface: Surface = fields.surface ?? 'default';
  return (
    <section aria-label={fields.aria_label ?? 'Sectors we serve'} className="border-y px-6 py-8 md:px-12" style={{ background: surfaceBg(t, surface), color: t.text, borderColor: t.line }}>
      <ul className="mx-auto flex max-w-5xl list-none flex-wrap justify-center gap-6 p-0">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1.5 text-[13px]" style={{ color: t.text3 }}>
            {it.icon && <span aria-hidden>{it.icon}</span>}
            {it.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
