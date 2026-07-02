// Extracted verbatim from netyvee/care components/sections/Hero.tsx — F1.2.
import Image from 'next/image';
import type { PageJson } from '../types';
import { imgSrc, imgAlt } from '../loader';

export function Hero({ fields, page }: { fields: any; page: PageJson }) {
  const src = imgSrc(fields.image);
  return (
    <section style={{ background: page.brand.bg, color: page.brand.text }} className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl md:text-5xl font-medium leading-tight">{fields.heading}</h1>
        {fields.sub && <p className="mt-4 max-w-2xl text-lg opacity-80">{fields.sub}</p>}
        {fields.cta_label && fields.cta_url && (
          <a href={fields.cta_url} style={{ background: page.brand.cta, color: page.brand.bg }}
             className="mt-8 inline-block rounded-lg px-6 py-3 font-medium">{fields.cta_label}</a>
        )}
        {src && (
          <div className="mt-10 overflow-hidden rounded-xl">
            <Image src={src} alt={imgAlt(fields.image, fields.image_alt)} width={1200} height={628} priority />
          </div>
        )}
      </div>
    </section>
  );
}
