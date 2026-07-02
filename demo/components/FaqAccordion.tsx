'use client';
// SECTION-LIBRARY §6 — faq variant:'accordion' demo (button + aria-expanded +
// max-height transition, chevron rotate).
import { useState } from 'react';

export function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="flex flex-col gap-3">
      {items.map((it, i) => (
        <div key={i} className="overflow-hidden rounded-lg" style={{ border: '1px solid var(--vf-line)' }}>
          <button
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium"
            aria-expanded={open === i}
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span>{it.q}</span>
            <svg
              width="18" height="18" viewBox="0 0 24 24" fill="none"
              className={`shrink-0 transition-transform duration-300 ${open === i ? 'rotate-180' : ''}`}
              stroke="var(--vf-accent)" strokeWidth="2"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <div className={`transition-all duration-300 ease-in-out ${open === i ? 'max-h-[600px]' : 'max-h-0'}`}>
            <p className="px-5 pb-5 text-sm leading-relaxed" style={{ color: 'var(--vf-text-3)' }}>{it.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
