import type { PageJson } from '../types';
import { imgSrc, imgAlt } from '../loader';
import { resolveTheme } from '../tokens/theme';
import { approvedDivisionHref } from './DivisionGateway';

// continuous_division_hero (v0.6.8, MAIN-HOMEPAGE-VISUAL-02) — the corporate homepage as ONE continuous
// hero, matching the founder-approved live-site pattern: a single team photograph spans the hero; the
// headline + supporting copy + teal accent sit in a navy scrim over the TOP-LEFT; the four division names
// + "Explore more" links sit in a dark scrim band at the BOTTOM of the SAME photo. There is NO separate
// white division-card section — the photo is the shared hero visual and the bottom band is the gateway.
//
// Governance is inherited from division_gateway: corporate-only (page.site==='main') and every
// destination must pass the approved division-host allow-list (approvedDivisionHref) — no fifth /
// unknown / duplicate host, no division→division. It carries NO rel / data-vf-rel / corporate_parent.
type Item = { title?: string; href?: string; cta_label?: string };

export function ContinuousDivisionHero({ fields, page }: { fields: any; page: PageJson }) {
  if (page.site !== 'main') return null; // the division gateway is the corporate front door only
  const t = resolveTheme(page.brand);
  const src = imgSrc(fields.hero_image);
  const mobileSrc = imgSrc(fields.hero_image_mobile); // art-directed narrow/2×2 source (optional)
  const alt = imgAlt(fields.hero_image, fields.hero_image_alt);
  const lines = String(fields.heading ?? '').split('\n').filter(Boolean);
  const sub = typeof fields.sub === 'string' ? fields.sub : '';

  const seen = new Set<string>();
  const items = (Array.isArray(fields.items) ? fields.items : [])
    .map((it: Item) => ({ it, href: approvedDivisionHref(it?.href) }))
    .filter((x: { it: Item; href: string | null }): x is { it: Item; href: string } => {
      if (!x.href || seen.has(x.href)) return false;
      seen.add(x.href);
      return true;
    });

  return (
    <section className="relative overflow-hidden" style={{ background: t.bgDeep, color: '#ffffff' }}>
      {/* Full-bleed team composite (LCP → eager). Art-directed: a mobile source (e.g. a 2×2 composite)
          swaps in ≤640px so all four divisions stay large; the desktop source is a balanced four-across
          composite. A plain <picture> (not next/image) is used because next/image can't art-direct sources. */}
      {src ? (
        <picture>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {mobileSrc && <source media="(max-width: 640px)" srcSet={mobileSrc} />}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: '50% 26%' }} loading="eager" />
        </picture>
      ) : (
        <div className="absolute inset-0" aria-hidden="true"
          style={{ background: `linear-gradient(115deg, ${t.bgDeep} 0%, ${t.bgAlt} 55%, #1c3454 100%)` }} />
      )}
      {/* TOP scrim — FULL-WIDTH vertical (equal darkening across all four columns, never left-biased), so
          the headline reads without singling out or obscuring any one division's representative. */}
      <div className="absolute inset-x-0 top-0" aria-hidden="true"
        style={{ height: '54%', background: 'linear-gradient(180deg, rgba(10,22,40,.9) 0%, rgba(10,22,40,.5) 34%, rgba(10,22,40,0) 100%)' }} />
      {/* BOTTOM scrim — carries the gateway band on the same photo. */}
      <div className="absolute inset-x-0 bottom-0" aria-hidden="true"
        style={{ height: '42%', background: 'linear-gradient(0deg, rgba(7,16,29,.95) 0%, rgba(7,16,29,.75) 48%, rgba(7,16,29,0) 100%)' }} />

      {/* thin vertical separators between the four columns (desktop only). */}
      <style>{`@media (min-width:1024px){.vf-hcol + .vf-hcol{border-left:1px solid rgba(255,255,255,.18);}}`}</style>

      <div className="relative z-[2] mx-auto flex min-h-[560px] max-w-6xl flex-col justify-between px-6 md:min-h-[600px]">
        {/* headline block — CENTRED in the upper hero (controlled max-width so the copy never becomes one
            over-long line; the full-width top scrim above supports centred text without a left-only block). */}
        <div className="mx-auto max-w-3xl pt-14 text-center md:pt-16">
          <h1 className="font-medium leading-[1.12]" style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(2rem,4.4vw,3.15rem)' }}>
            {lines.length ? lines.map((l, i) => <span key={i} className="block">{l}</span>) : fields.heading}
          </h1>
          {sub && <p className="mx-auto mt-5 max-w-[46ch] text-base leading-relaxed md:text-lg" style={{ color: 'rgba(255,255,255,.82)' }}>{sub}</p>}
          <div className="mx-auto mt-6 h-[3px] w-14 rounded-full" style={{ background: t.accent }} aria-hidden="true" />
        </div>

        {/* bottom gateway band on the same photo */}
        <ul id="divisions" className="grid list-none grid-cols-2 gap-y-6 p-0 pb-10 pt-10 lg:grid-cols-4 lg:gap-y-0">
          {items.map(({ it, href }: { it: Item; href: string }) => {
            const label = typeof it.cta_label === 'string' && it.cta_label.trim() ? it.cta_label : 'Explore more';
            return (
              <li key={href} className="vf-hcol px-4 lg:px-6">
                <a href={href} className="group block">
                  <h2 className="text-lg font-medium md:text-xl" style={{ fontFamily: 'var(--font-playfair)', color: '#ffffff' }}>{it.title}</h2>
                  <span className="mt-2 inline-flex items-center gap-2 text-sm font-medium" style={{ color: t.accent }}>
                    {label}<span aria-hidden="true">→</span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
