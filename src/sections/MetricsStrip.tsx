// metrics_strip (SECTION-LIBRARY §11). Verified numbers ONLY (the CRM gate treats
// unverifiable numerals as forbidden-claim class; a site with no verified metric
// omits this section rather than fabricating — CONTENT-PROVENANCE-POLICY / V0.2 §8).
import type { PageJson } from '../types';
import { resolveTheme, surfaceBg, type Surface } from '../tokens/theme';

type Item = { value: string; label: string };

// Static class strings so the consumer's Tailwind keeps them (no dynamic names).
const MD_COLS: Record<number, string> = {
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
};

export function MetricsStrip({ fields, page }: { fields: any; page: PageJson }) {
  const items: Item[] = Array.isArray(fields?.items) ? fields.items : [];
  if (items.length === 0) return null;
  const t = resolveTheme(page.brand);
  const surface: Surface = fields.surface ?? 'default';
  const cols = Math.min(Math.max(items.length, 2), 4);
  return (
    <section aria-label={fields.aria_label ?? 'Key figures'} style={{ background: surfaceBg(t, surface), color: t.text }}>
      <dl className={`mx-auto grid max-w-5xl grid-cols-2 gap-0 ${MD_COLS[cols] ?? 'md:grid-cols-4'}`}>
        {items.map((it, i) => (
          <div key={i} className="px-4 py-5 text-center" style={{ borderRight: `1px solid ${t.lineAccent}` }}>
            <dd className="m-0 text-[26px] font-bold" style={{ color: t.accent }}>{it.value}</dd>
            <dt className="text-[11px] leading-tight" style={{ color: t.text5 }}>{it.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
