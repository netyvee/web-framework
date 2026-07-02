// Extracted verbatim from netyvee/care components/sections/Testimonial.tsx — F1.2.
import type { PageJson } from '../types';

export function Testimonial({ fields, page }: { fields: any; page: PageJson }) {
  const items: any[] = fields.items ?? [];
  return (
    <section style={{ background: page.brand.bg, color: page.brand.text }} className="px-6 py-16">
      <div className="mx-auto max-w-4xl space-y-8">
        {items.map((it, i) => (
          <blockquote key={i} className="border-l-2 pl-5" style={{ borderColor: page.brand.cta }}>
            <p className="text-lg italic opacity-90">&ldquo;{it.quote}&rdquo;</p>
            <footer className="mt-2 text-sm opacity-70">— {it.author}</footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}
