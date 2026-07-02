// Extracted verbatim from netyvee/staffing components/sections/Prose.tsx — F1.2.
// Text-only prose block for migrated/restored source body content. No image slot.
import type { PageJson } from '../types';

export function Prose({ fields, page }: { fields: any; page: PageJson }) {
  if (!fields?.body) return null;
  return (
    <section style={{ background: page.brand.bg, color: page.brand.text }} className="px-6 py-10">
      <div className="mx-auto max-w-4xl">
        {fields.heading && <h2 className="mb-4 text-2xl font-medium">{fields.heading}</h2>}
        <p className="leading-relaxed opacity-80">{fields.body}</p>
      </div>
    </section>
  );
}
