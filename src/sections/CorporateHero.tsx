import type { PageJson } from '../types';
import { resolveTheme, surfaceBg } from '../tokens/theme';

// corporate_hero (v0.6.6, MAIN-HOMEPAGE-VISUAL-02) — the light corporate homepage's ONE dark band:
// a navy field carrying a large elegant serif headline + concise supporting copy + a short teal accent
// rule, matching the founder-approved reference hero. It paints its own dark surface (surface 'deep')
// with light text, so it reads correctly on the site's otherwise WHITE ground. It carries NO image
// (the four division images live in division_image_gateway; the reference's blended hero photo is not
// duplicated) and NO unsupported claims — copy is data.
export function CorporateHero({ fields, page }: { fields: any; page: PageJson }) {
  const t = resolveTheme(page.brand);
  const bg = surfaceBg(t, 'deep');
  const heading = typeof fields.heading === 'string' ? fields.heading : '';
  const sub = typeof fields.sub === 'string' ? fields.sub : '';
  return (
    <section style={{ background: bg, color: '#ffffff' }} className="px-6 py-20 md:py-28 lg:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          {heading && (
            <h1
              className="text-4xl font-medium leading-[1.08] md:text-6xl"
              style={{ fontFamily: 'var(--font-playfair)', textWrap: 'balance' }}
            >
              {heading}
            </h1>
          )}
          {sub && <p className="mt-6 max-w-xl text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.82)' }}>{sub}</p>}
          <div className="mt-8 h-[3px] w-16 rounded-full" style={{ background: t.accent }} aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
