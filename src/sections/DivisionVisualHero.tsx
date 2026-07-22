import Image from 'next/image';
import type { PageJson } from '../types';
import { imgSrc, imgAlt } from '../loader';

// division_visual_hero (MAIN-HOMEPAGE-VISUAL-01) — the corporate homepage hero:
//   H1 + supporting copy + a governed 2×2 grid of FOUR division image placeholders (one per division,
//   FIXED order). The four divisions and their order are the governed contract (not data) — a fifth /
//   unknown / duplicate / mis-ordered entry can never render. Images ARE data (fields.images supplies a
//   per-division image + alt), so each slot is independently replaceable without touching the layout or
//   the others.
//   It is deliberately NOT a marketing grid and NOT clickable: it renders no links, so it adds no
//   corporate_parent, no data-vf-rel, and no division→division edge — the division_gateway cards remain
//   the sole destinations. No carousel/slider/auto-rotation (all four are visible at once).
const DIVISIONS = [
  { id: 'care_services', label: 'Care Services' },
  { id: 'care_staffing', label: 'Care Staffing' },
  { id: 'security_services', label: 'Security Services' },
  { id: 'cleaning_services', label: 'Cleaning Services' },
] as const;

export const DIVISION_VISUAL_IDS: readonly string[] = DIVISIONS.map((d) => d.id);

export function DivisionVisualHero({ fields, page }: { fields: any; page: PageJson }) {
  const heading = typeof fields.heading === 'string' ? fields.heading : '';
  const sub = typeof fields.sub === 'string' ? fields.sub : '';
  // Match supplied images to the fixed divisions by id; first entry per id wins (dedupe); unknown ids
  // are ignored (they can never add a slot). Missing → a polished placeholder (never a broken box).
  const byId: Record<string, any> = {};
  const supplied = Array.isArray(fields.images) ? fields.images : [];
  for (const it of supplied) {
    if (it && typeof it.division === 'string' && !byId[it.division]) byId[it.division] = it;
  }
  return (
    <section style={{ background: page.brand.bg, color: page.brand.text }} className="px-6 py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
        <div>
          {heading && (
            <h1 className="text-4xl font-medium md:text-5xl" style={{ fontFamily: 'var(--font-playfair)' }}>{heading}</h1>
          )}
          {sub && <p className="mt-4 max-w-md text-lg leading-relaxed opacity-80">{sub}</p>}
        </div>
        <ul role="list" aria-label="Our divisions" className="grid list-none grid-cols-2 gap-4 p-0 sm:gap-5">
          {DIVISIONS.map((d) => {
            const item = byId[d.id];
            const src = item ? imgSrc(item.image) : null;
            return (
              <li key={d.id}>
                <figure className="m-0">
                  <div
                    className="overflow-hidden rounded-xl border border-white/10"
                    style={{ aspectRatio: '4 / 3' }}
                  >
                    {src ? (
                      <Image
                        src={src}
                        alt={imgAlt(item.image, item.image_alt) || d.label}
                        width={640}
                        height={480}
                        sizes="(max-width: 1024px) 45vw, 300px"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      // Polished placeholder: brand navy→teal gradient + the division label. Fixed aspect
                      // ratio so there is no layout shift when a real image is later supplied.
                      <div
                        className="flex h-full w-full items-center justify-center text-center"
                        style={{ background: `linear-gradient(135deg, ${page.brand.bg} 0%, ${page.brand.secondary}33 100%)` }}
                        aria-hidden="true"
                      >
                        <span className="px-3 text-sm font-medium" style={{ color: page.brand.secondary }}>{d.label}</span>
                      </div>
                    )}
                  </div>
                  <figcaption className="mt-2 text-center text-sm font-medium opacity-80">{d.label}</figcaption>
                </figure>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
