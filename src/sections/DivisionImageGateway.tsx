import Image from 'next/image';
import type { PageJson } from '../types';
import { imgSrc, imgAlt } from '../loader';
import { resolveTheme } from '../tokens/theme';
import { approvedDivisionHref } from './DivisionGateway';

// division_image_gateway (v0.6.6, MAIN-HOMEPAGE-VISUAL-02) — the PRIMARY corporate gateway, image-led.
// Four equal columns, each a strict vertical unit in this DOM order (founder amendment):
//     [division image] → [division name] → [Explore more →]
// so every image sits directly above its own title and link. Governance is inherited from
// division_gateway: corporate-only (page.site==='main'), and every destination must pass the approved
// division-host allow-list (approvedDivisionHref) — a non-approved or duplicate host can never render,
// so this can never become a generic external-card grid. It carries NO rel / data-vf-rel /
// corporate_parent (an image gateway is not the D-095 ownership edge).
type Item = { title?: string; image?: any; image_alt?: string; href?: string; cta_label?: string };

export function DivisionImageGateway({ fields, page }: { fields: any; page: PageJson }) {
  // Corporate front door only — a division site can never render division→division links.
  if (page.site !== 'main') return null;
  const t = resolveTheme(page.brand);
  const line = t.line;
  const raw: Item[] = Array.isArray(fields.items) ? fields.items : [];

  // Keep only approved-host destinations, first-wins per host (dedupe → ≤4 unique divisions,
  // no duplicate, no unsupported fifth).
  const seen = new Set<string>();
  const items = raw
    .map((it) => ({ it, href: approvedDivisionHref(it?.href) }))
    .filter((x): x is { it: Item; href: string } => {
      if (!x.href || seen.has(x.href)) return false;
      seen.add(x.href);
      return true;
    });

  if (items.length === 0) return null;

  return (
    <section id="divisions" style={{ background: page.brand.bg, color: page.brand.text }} className="px-6 py-16 md:py-24">
      {/* lg-only thin vertical separators between the four columns (reference treatment). */}
      <style>{`@media (min-width:1024px){.vf-divcol + .vf-divcol{border-left:1px solid ${line};}}`}</style>
      <ul className="mx-auto grid max-w-6xl list-none grid-cols-1 gap-x-0 gap-y-12 p-0 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-4">
        {items.map(({ it, href }, i) => {
          const src = imgSrc(it.image);
          const label = typeof it.cta_label === 'string' && it.cta_label.trim() ? it.cta_label : 'Explore more';
          return (
            <li key={href} className="vf-divcol flex flex-col items-center px-0 text-center lg:px-8">
              {/* 1 — IMAGE (fixed 3:4 box → no layout shift; consistent crop across all four) */}
              <div className="w-full overflow-hidden rounded-xl" style={{ aspectRatio: '3 / 4' }}>
                {src ? (
                  <Image
                    src={src}
                    alt={imgAlt(it.image, it.image_alt) || it.title || ''}
                    width={360}
                    height={480}
                    sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 280px"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center" style={{ background: `linear-gradient(135deg, ${t.bgDeep} 0%, ${t.accent}33 100%)` }} aria-hidden="true">
                    <span className="px-3 text-sm font-medium" style={{ color: '#ffffff' }}>{it.title}</span>
                  </div>
                )}
              </div>
              {/* 2 — TITLE */}
              <h3 className="mt-6 text-2xl font-medium" style={{ fontFamily: 'var(--font-playfair)', color: page.brand.text }}>{it.title}</h3>
              {/* 3 — EXPLORE MORE link (the division destination) */}
              <a href={href} className="mt-3 inline-flex items-center gap-2 text-sm font-medium hover:underline" style={{ color: t.accent }}>
                {label}
                <span aria-hidden="true">→</span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
