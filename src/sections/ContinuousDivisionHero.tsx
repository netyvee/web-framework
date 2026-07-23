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
  // ONE text run (newlines in the content are joined to a space), NOT forced <span> lines — so the
  // heading stays on a single line wherever it fits (desktop/tablet) and only wraps on narrow screens.
  const headingText = String(fields.heading ?? '').split('\n').map((s) => s.trim()).filter(Boolean).join(' ');
  const sub = typeof fields.sub === 'string' ? fields.sub : '';

  const seen = new Set<string>();
  const items = (Array.isArray(fields.items) ? fields.items : [])
    .map((it: Item) => ({ it, href: approvedDivisionHref(it?.href) }))
    .filter((x: { it: Item; href: string | null }): x is { it: Item; href: string } => {
      if (!x.href || seen.has(x.href)) return false;
      seen.add(x.href);
      return true;
    });

  const topScrim = 'linear-gradient(180deg, rgba(10,22,40,.9) 0%, rgba(10,22,40,.5) 34%, rgba(10,22,40,0) 100%)';
  const botScrim = 'linear-gradient(0deg, rgba(7,16,29,.95) 0%, rgba(7,16,29,.75) 48%, rgba(7,16,29,0) 100%)';

  return (
    // RESPONSIVE COMPOSITION.
    //  • Mobile (<768px): a STACKED flow — compact navy headline band → team image (2×2) → navy gateway
    //    band. Text never overlaps faces, so it reads cleanly on a small screen; the shared navy ground
    //    keeps it one continuous composition.
    //  • Desktop (≥768px): the same three parts OVERLAY one full-bleed image (headline top scrim, gateway
    //    bottom scrim) — the approved continuous hero. Same markup + links, no duplication.
    <section
      className="relative flex flex-col overflow-hidden lg:block lg:min-h-[600px]"
      style={{ background: t.bgDeep, color: '#ffffff' }}
    >
      <style>{`@media (min-width:1024px){.vf-hcol + .vf-hcol{border-left:1px solid rgba(255,255,255,.18);}}`}</style>

      {/* HEADLINE — mobile/tablet (<lg): compact top navy band (STACKED, so text never covers faces);
          desktop (≥lg): absolute top overlay. */}
      <div className="relative z-[2] order-1 px-6 pb-6 pt-9 text-center lg:absolute lg:inset-x-0 lg:top-0 lg:pb-0 lg:pt-16">
        <div className="mx-auto w-full max-w-6xl">
          {/* Fluid size keeps the heading on ONE line at desktop/tablet widths (it fits the wide content
              column) and lets it wrap — balanced, two lines — on mobile. No whitespace-nowrap: that forced
              the element to min-content width and pushed the whole mobile page into horizontal overflow. */}
          <h1
            className="font-medium leading-[1.04] [text-wrap:balance] text-[clamp(1.7rem,1rem+2.7vw,3.5rem)] md:leading-[1]"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            {headingText || fields.heading}
          </h1>
          {sub && (
            <p className="mx-auto mt-3 max-w-[34ch] text-sm leading-relaxed md:mt-4 md:max-w-[52ch] md:text-lg" style={{ color: 'rgba(255,255,255,.85)' }}>
              {sub}
            </p>
          )}
          <div className="mx-auto mt-5 h-[3px] w-12 rounded-full md:mt-6 md:w-14" style={{ background: t.accent }} aria-hidden="true" />
        </div>
      </div>

      {/* IMAGE — mobile/tablet (<lg): in-flow, full-width (its own height, so all four faces show without
          side-cropping); desktop (≥lg): absolute full-bleed background. The mobile source (a 2×2) swaps in
          ≤767px; tablet uses the four-across source at full width (all four visible, no crop). */}
      {src ? (
        <picture className="order-2 block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {mobileSrc && <source media="(max-width: 767px)" srcSet={mobileSrc} />}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="block h-auto w-full lg:absolute lg:inset-0 lg:h-full lg:w-full lg:object-cover"
            style={{ objectPosition: '50% 26%' }}
            loading="eager"
          />
        </picture>
      ) : (
        <div className="order-2 aspect-[4/3] w-full lg:absolute lg:inset-0 lg:aspect-auto" aria-hidden="true"
          style={{ background: `linear-gradient(115deg, ${t.bgDeep} 0%, ${t.bgAlt} 55%, #1c3454 100%)` }} />
      )}

      {/* DESKTOP-only scrims (hidden in the stacked mobile/tablet flow). */}
      <div className="absolute inset-x-0 top-0 hidden lg:block" aria-hidden="true" style={{ height: '54%', background: topScrim }} />
      <div className="absolute inset-x-0 bottom-0 hidden lg:block" aria-hidden="true" style={{ height: '42%', background: botScrim }} />

      {/* GATEWAY — mobile/tablet: navy band below the image (2×2 readable tiles); desktop: absolute bottom overlay. */}
      <div className="relative z-[2] order-3 pb-9 pt-7 lg:absolute lg:inset-x-0 lg:bottom-0 lg:pb-10 lg:pt-10">
        <ul id="divisions" className="mx-auto grid max-w-6xl list-none grid-cols-2 gap-x-4 gap-y-7 p-0 px-6 lg:gap-y-0 lg:grid-cols-4">
          {items.map(({ it, href }: { it: Item; href: string }) => {
            const label = typeof it.cta_label === 'string' && it.cta_label.trim() ? it.cta_label : 'Explore more';
            return (
              <li key={href} className="vf-hcol lg:px-6">
                <a href={href} className="group block py-1">
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
