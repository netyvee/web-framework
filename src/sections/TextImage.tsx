// Extracted verbatim from netyvee/care components/sections/TextImage.tsx — F1.2.
//
// F2-08 spike (netyvee/app#344): `fields.blocks` is an ADDITIVE, optional
// alternative to the flat `heading`/`body` strings, for intro content that is
// genuinely multi-paragraph (a service page's bespoke ServicePageData.intro is
// 2-3 HTML paragraphs today) — the same gap Prose's own `blocks` field already
// closed for text-only sections, reused here via Prose's exported `renderBlock`
// rather than a second block renderer. Structured data only, never raw HTML.
// Omitted ⇒ byte-identical to before for every existing consumer.
import Image from 'next/image';
import type { PageJson, ProseBlock } from '../types';
import { imgSrc, imgAlt } from '../loader';
import { renderBlock } from './Prose';

export function TextImage({ fields, page }: { fields: any; page: PageJson }) {
  const src = imgSrc(fields.image);
  const blocks: ProseBlock[] | undefined = Array.isArray(fields.blocks) ? fields.blocks : undefined;
  return (
    <section style={{ background: page.brand.bg, color: page.brand.text }} className="px-6 py-16">
      <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
        <div>
          <h2 className="text-3xl font-medium">{fields.heading}</h2>
          {blocks ? (
            <div className="mt-4">{blocks.map((b, i) => renderBlock(b, i))}</div>
          ) : (
            <p className="mt-4 opacity-80">{fields.body}</p>
          )}
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
