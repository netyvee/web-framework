// compliance_strip (SECTION-LIBRARY §13). Accreditation / assurance chips on the
// deep surface. Items are permitted-claim strings (CRM claims gate applies).
import type { PageJson } from '../types';
import { resolveTheme, surfaceBg, type Surface } from '../tokens/theme';

export function ComplianceStrip({ fields, page }: { fields: any; page: PageJson }) {
  const raw: any[] = Array.isArray(fields?.items) ? fields.items : [];
  const items: string[] = raw.map((it) => (typeof it === 'string' ? it : it?.label)).filter(Boolean);
  if (items.length === 0) return null;
  const t = resolveTheme(page.brand);
  const surface: Surface = fields.surface ?? 'deep';
  return (
    <section aria-label={fields.aria_label ?? 'Compliance and assurance'} className="flex flex-wrap justify-center gap-5 border-y px-6 py-4 md:px-12" style={{ background: surfaceBg(t, surface), color: t.text, borderColor: t.lineAccent }}>
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5 text-[12px]" style={{ color: t.text4 }}>
          <span aria-hidden style={{ color: t.accent }}>✓</span>
          {it}
        </span>
      ))}
    </section>
  );
}
