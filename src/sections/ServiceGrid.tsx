// Extracted verbatim from netyvee/care components/sections/ServiceGrid.tsx — F1.2.
// v0.4.0: optional per-item internal `href` makes a card a link (used for clickable
// location-hub cards and blog-index article cards). Items WITHOUT href render
// byte-identically to v0.3.x, so existing consumers (Care) are unaffected.
import Image from 'next/image';
import Link from 'next/link';
import type { PageJson } from '../types';
import { imgSrc, imgAlt } from '../loader';

export function ServiceGrid({ fields, page }: { fields: any; page: PageJson }) {
  const items: any[] = fields.items ?? [];
  return (
    <section style={{ background: page.brand.bg, color: page.brand.text }} className="px-6 py-16">
      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((it, i) => {
          const src = imgSrc(it.image);
          const inner = (
            <>
              {src && <Image src={src} alt={imgAlt(it.image, it.image_alt)} width={400} height={260} className="mb-4 rounded-lg" />}
              <h3 className="text-xl font-medium" style={{ color: page.brand.secondary }}>{it.title}</h3>
              <p className="mt-2 opacity-80">{it.body}</p>
              {it.href && (
                <span className="mt-3 inline-block text-sm font-medium" style={{ color: page.brand.cta }}>Learn more →</span>
              )}
            </>
          );
          // Internal links only (leading slash) — mirrors the LocationsCoverage CRM gate.
          const internal = typeof it.href === 'string' && it.href.startsWith('/');
          return internal ? (
            <Link key={i} href={it.href} className="block rounded-xl border border-white/10 p-6 transition-colors hover:border-white/30">
              {inner}
            </Link>
          ) : (
            <div key={i} className="rounded-xl border border-white/10 p-6">
              {inner}
            </div>
          );
        })}
      </div>
    </section>
  );
}
