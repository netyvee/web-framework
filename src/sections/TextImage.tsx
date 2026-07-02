// Extracted verbatim from netyvee/care components/sections/TextImage.tsx — F1.2.
import Image from 'next/image';
import type { PageJson } from '../types';
import { imgSrc, imgAlt } from '../loader';

export function TextImage({ fields, page }: { fields: any; page: PageJson }) {
  const src = imgSrc(fields.image);
  return (
    <section style={{ background: page.brand.bg, color: page.brand.text }} className="px-6 py-16">
      <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
        <div>
          <h2 className="text-3xl font-medium">{fields.heading}</h2>
          <p className="mt-4 opacity-80">{fields.body}</p>
        </div>
        {src && (
          <div className="overflow-hidden rounded-xl">
            <Image src={src} alt={imgAlt(fields.image, fields.image_alt)} width={600} height={400} />
          </div>
        )}
      </div>
    </section>
  );
}
