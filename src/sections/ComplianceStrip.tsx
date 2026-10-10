// compliance_strip (SECTION-LIBRARY §13). Accreditation / assurance chips on the
// deep surface. Items are permitted-claim strings (CRM claims gate applies).
//
// F2-08 closure (netyvee/app#344, Founder disposition on the spike evidence,
// comment after 6098253461): optional `heading`, a VISIBLE label above the
// chips (e.g. "Regulatory compliance") — the bespoke `ComplianceStrip` this
// section was compared against renders that label as a real `<p>`, not just an
// `aria-label`, so the spike's `aria_label`-only version lost visible
// structure. Omitted ⇒ byte-identical to before (every existing consumer).
import type { PageJson } from '../types';
import { resolveTheme, surfaceBg, type Surface } from '../tokens/theme';

export function ComplianceStrip({ fields, page }: { fields: any; page: PageJson }) {
  const raw: any[] = Array.isArray(fields?.items) ? fields.items : [];
  const items: string[] = raw.map((it) => (typeof it === 'string' ? it : it?.label)).filter(Boolean);
  if (items.length === 0) return null;
  const t = resolveTheme(page.brand);
  const surface: Surface = fields.surface ?? 'deep';
  const chips = items.map((it, i) => (
    <span key={i} className="flex items-center gap-1.5 text-[12px]" style={{ color: t.text4 }}>
      <span aria-hidden style={{ color: t.accent }}>✓</span>
      {it}
    </span>
  ));
  // No heading ⇒ byte-identical to the pre-F2-08-closure markup: the <section>
  // itself is the flex row, same tag/className/children as before.
  if (!fields.heading) {
    return (
      <section aria-label={fields.aria_label ?? 'Compliance and assurance'} className="flex flex-wrap justify-center gap-5 border-y px-6 py-4 md:px-12" style={{ background: surfaceBg(t, surface), color: t.text, borderColor: t.lineAccent }}>
        {chips}
      </section>
    );
  }
  return (
    <section aria-label={fields.aria_label ?? 'Compliance and assurance'} className="border-y px-6 py-4 md:px-12" style={{ background: surfaceBg(t, surface), color: t.text, borderColor: t.lineAccent }}>
      <p className="mb-5 text-center text-[11px] font-medium uppercase tracking-widest" style={{ color: t.text4 }}>
        {fields.heading}
      </p>
      <div className="flex flex-wrap justify-center gap-5">{chips}</div>
    </section>
  );
}
