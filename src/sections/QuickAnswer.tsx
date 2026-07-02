// quick_answer (SECTION-LIBRARY §16). AEO answer panel — accent-bordered emphasis.
import type { PageJson } from '../types';
import { resolveTheme, surfaceBg, type Surface } from '../tokens/theme';

export function QuickAnswer({ fields, page }: { fields: any; page: PageJson }) {
  const text: string = fields?.text ?? '';
  if (!text) return null;
  const t = resolveTheme(page.brand);
  const surface: Surface = fields.surface ?? 'default';
  return (
    <section className="px-6 py-8 md:px-12" style={{ background: surfaceBg(t, surface), color: t.text }}>
      <div
        className="mx-auto max-w-4xl rounded-r p-5 text-sm"
        style={{ borderLeft: `2px solid ${t.accent}`, background: t.lineAccent, color: t.text2 }}
      >
        {fields.label && <strong style={{ color: t.accent }}>{fields.label} </strong>}
        {text}
      </div>
    </section>
  );
}
