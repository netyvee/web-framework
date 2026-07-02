// Extracted verbatim from netyvee/care components/sections/Cta.tsx — F1.2.
import type { PageJson } from '../types';

export function Cta({ fields, page }: { fields: any; page: PageJson }) {
  return (
    <section style={{ background: page.brand.bg, color: page.brand.text }} className="px-6 py-16 text-center">
      <h2 className="text-3xl font-medium">{fields.heading}</h2>
      {fields.sub && <p className="mx-auto mt-3 max-w-2xl opacity-80">{fields.sub}</p>}
      <a href={fields.cta_url} style={{ background: page.brand.cta, color: page.brand.bg }}
         className="mt-6 inline-block rounded-lg px-6 py-3 font-medium">{fields.cta_label}</a>
    </section>
  );
}
