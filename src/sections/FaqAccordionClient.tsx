'use client';
// FAQ accordion (SECTION-LIBRARY §6 variant:'accordion'). Client component:
// button + aria-expanded + region + keyboard-native (real <button>), chevron
// rotate + height transition. The server Faq delegates here when variant is
// 'accordion'; the default 'list' path stays a server dl (byte-identical to
// v0.1.x — parity preserved).
import { useId, useState } from 'react';

type Item = { q: string; a: string };
type Colors = { text: string; text3: string; secondary: string; accent: string; line: string; bg: string };

export function FaqAccordionClient({ items, colors, heading }: { items: Item[]; colors: Colors; heading?: string }) {
  const [open, setOpen] = useState<number | null>(0);
  const base = useId();
  return (
    <section className="px-6 py-16" style={{ background: colors.bg, color: colors.text }}>
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-6 text-3xl font-medium">{heading ?? 'Frequently asked questions'}</h2>
        <div className="flex flex-col gap-3">
          {items.map((it, i) => {
            const panelId = `${base}-panel-${i}`;
            const btnId = `${base}-btn-${i}`;
            const isOpen = open === i;
            return (
              <div key={i} className="overflow-hidden rounded-lg" style={{ border: `1px solid ${colors.line}` }}>
                <button
                  id={btnId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium"
                  style={{ color: colors.text }}
                >
                  <span style={{ color: colors.secondary }}>{it.q}</span>
                  <svg
                    width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden
                    className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    stroke={colors.accent} strokeWidth="2"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={btnId}
                  hidden={!isOpen}
                  className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[600px]' : 'max-h-0'}`}
                >
                  <p className="px-5 pb-5 text-sm leading-relaxed" style={{ color: colors.text3 }}>{it.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
