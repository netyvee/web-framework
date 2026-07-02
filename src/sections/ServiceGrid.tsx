// Extracted verbatim from netyvee/care components/sections/ServiceGrid.tsx — F1.2.
import Image from 'next/image';
import type { PageJson } from '../types';
import { imgSrc, imgAlt } from '../loader';

export function ServiceGrid({ fields, page }: { fields: any; page: PageJson }) {
  const items: any[] = fields.items ?? [];
  return (
    <section style={{ background: page.brand.bg, color: page.brand.text }} className="px-6 py-16">
      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((it, i) => {
          const src = imgSrc(it.image);
          return (
            <div key={i} className="rounded-xl border border-white/10 p-6">
              {src && <Image src={src} alt={imgAlt(it.image, it.image_alt)} width={400} height={260} className="mb-4 rounded-lg" />}
              <h3 className="text-xl font-medium" style={{ color: page.brand.secondary }}>{it.title}</h3>
              <p className="mt-2 opacity-80">{it.body}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
