// faq (SECTION-LIBRARY §6). Default 'list' variant is the v0.1.x server <dl> —
// UNCHANGED (byte-identical, parity-safe). variant:'accordion' delegates to the
// client accordion (keyboard + aria). A server component may render a client one.
import type { PageJson } from '../types';
import { resolveTheme } from '../tokens/theme';
import { FaqAccordionClient } from './FaqAccordionClient';

export function Faq({ fields, page }: { fields: any; page: PageJson }) {
  const items: any[] = fields.items ?? [];

  if (fields.variant === 'accordion') {
    const t = resolveTheme(page.brand);
    return (
      <FaqAccordionClient
        items={items}
        heading={fields.heading}
        colors={{ text: t.text, text3: t.text3, secondary: page.brand.secondary, accent: page.brand.cta, line: t.line, bg: page.brand.bg }}
      />
    );
  }

  // default 'list' — unchanged from v0.1.x
  return (
    <section style={{ background: page.brand.bg, color: page.brand.text }} className="px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-6 text-3xl font-medium">Frequently asked questions</h2>
        <dl className="space-y-5">
          {items.map((it, i) => (
            <div key={i} className="border-b border-white/10 pb-4">
              <dt className="font-medium" style={{ color: page.brand.secondary }}>{it.q}</dt>
              <dd className="mt-1 opacity-80">{it.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
