// image_banner (F2-08 borough/location batch, netyvee/app#344). A standalone, full-width
// image band — the borough pages' "local area" image has no equivalent in the section library
// (text_image/hero pair an image with text; this is the image alone). Optional `max_height`
// class is intentionally NOT exposed: the band is capped at max-h-64 like the bespoke page.
import Image from 'next/image';
import type { PageJson } from '../types';
import { imgSrc, imgAlt } from '../loader';
import { surfaceBg, resolveTheme, type Surface } from '../tokens/theme';

export function ImageBanner({ fields, page }: { fields: any; page: PageJson }) {
  const src = imgSrc(fields?.image);
  if (!src) return null;
  const t = resolveTheme(page.brand);
  const surface: Surface = fields.surface ?? 'default';
  return (
    <section className="px-6 py-14 md:px-12" style={{ background: surfaceBg(t, surface), color: t.text }}>
      <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl">
        <Image src={src} alt={imgAlt(fields.image, fields.image_alt)} width={fields.width ?? 1200} height={fields.height ?? 600} className="max-h-64 w-full object-cover" />
      </div>
    </section>
  );
}
