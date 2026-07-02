// Extracted verbatim from netyvee/care components/sections/Faq.tsx — F1.2.
import type { PageJson } from '../types';

export function Faq({ fields, page }: { fields: any; page: PageJson }) {
  const items: any[] = fields.items ?? [];
  return (
    <section style={{ background: page.brand.bg, color: page.brand.text }} className="px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-6 text-3xl font-medium">Frequently asked questions</h2>
        <dl className="space-y-5">
          {items.map((it, i) => (
            <div key={i} className="border-b border-white/10 pb-4">
              <dt className="font-medium" style={{ color: page.brand.secondary }}>{it.q}</dt>
              <dd className="mt-1 opacity-80">{it.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
