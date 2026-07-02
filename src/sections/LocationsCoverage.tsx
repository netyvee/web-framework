// locations_coverage (SECTION-LIBRARY §17). Linked coverage pills + muted
// (unlinked) pills; optional view-all. Internal hrefs only (CRM gate).
import Link from 'next/link';
import type { PageJson } from '../types';
import { resolveTheme, surfaceBg, type Surface } from '../tokens/theme';

type Loc = { label: string; href?: string };

export function LocationsCoverage({ fields, page }: { fields: any; page: PageJson }) {
  const raw: any[] = Array.isArray(fields?.locations) ? fields.locations : [];
  const locations: Loc[] = raw.map((l) => (typeof l === 'string' ? { label: l } : l)).filter((l) => l?.label);
  if (locations.length === 0) return null;
  const t = resolveTheme(page.brand);
  const surface: Surface = fields.surface ?? 'default';
  return (
    <section className="border-b px-6 py-16 md:px-12" style={{ background: surfaceBg(t, surface), color: t.text, borderColor: t.line }}>
      <div className="mx-auto max-w-5xl">
        {fields.heading && <h2>{fields.heading}</h2>}
        <ul className="mt-6 flex list-none flex-wrap gap-2 p-0">
          {locations.map((l, i) => (
            <li key={i}>
              {l.href ? (
                <Link href={l.href} className="inline-block rounded-full px-3 py-1 text-xs font-medium" style={{ color: t.accent, background: t.lineAccent, border: `1px solid ${t.accent}` }}>
                  {l.label}
                </Link>
              ) : (
                <span className="inline-block rounded-full px-3 py-1 text-xs" style={{ color: t.text5, border: `1px solid ${t.line}` }}>{l.label}</span>
              )}
            </li>
          ))}
        </ul>
        {fields.view_all_label && fields.view_all_url && (
          <Link href={fields.view_all_url} className="mt-5 inline-block text-[13px] font-medium" style={{ color: t.accent }}>
            {fields.view_all_label} →
          </Link>
        )}
      </div>
    </section>
  );
}
