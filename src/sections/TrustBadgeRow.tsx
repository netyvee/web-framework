// trust_badge_row (SECTION-LIBRARY §10). Qualitative trust — icon/stat + label
// row on a hairline band; horizontal scroll on mobile. Colours from page.brand.
import type { PageJson } from '../types';
import { resolveTheme, surfaceBg, type Surface } from '../tokens/theme';

type Item = { icon?: string; stat?: string; label: string };

export function TrustBadgeRow({ fields, page }: { fields: any; page: PageJson }) {
  const items: Item[] = Array.isArray(fields?.items) ? fields.items : [];
  if (items.length === 0) return null; // empty-state: render nothing
  const t = resolveTheme(page.brand);
  const surface: Surface = fields.surface ?? 'default';
  return (
    <section
      aria-label={fields.aria_label ?? 'Trust indicators'}
      className="overflow-x-auto border-y px-6 md:px-12"
      style={{ background: surfaceBg(t, surface), color: t.text, borderColor: t.lineAccent, paddingTop: 'var(--vf-strip-y)', paddingBottom: 'var(--vf-strip-y)' }}
    >
      <ul className="mx-auto flex min-w-max list-none justify-center gap-8 p-0 md:min-w-0">
        {items.map((it, i) => (
          <li key={i} className="flex shrink-0 items-center gap-2">
            {(it.icon || it.stat) && (
              <span aria-hidden={!!it.icon} className="text-[13px] font-medium" style={{ color: t.accent }}>
                {it.icon ?? it.stat}
              </span>
            )}
            <span className="text-[12px]" style={{ color: t.text3 }}>{it.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
