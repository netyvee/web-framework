// Extracted verbatim from netyvee/care components/sections/BoroughBlock.tsx — F1.2.
import type { PageJson } from '../types';

export function BoroughBlock({ fields, page }: { fields: any; page: PageJson }) {
  return (
    <section style={{ background: page.brand.bg, color: page.brand.text }} className="px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-2xl font-medium" style={{ color: page.brand.secondary }}>{fields.borough}</h2>
        <p className="mt-3 opacity-80">{fields.body}</p>
      </div>
    </section>
  );
}
