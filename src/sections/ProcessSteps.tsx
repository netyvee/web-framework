// process_steps (SECTION-LIBRARY §15). Numbered steps, optional per-step image.
import Image from 'next/image';
import type { PageJson } from '../types';
import { imgSrc, imgAlt } from '../loader';
import { resolveTheme, surfaceBg, type Surface } from '../tokens/theme';

type Step = { number?: number | string; title: string; body: string; timeframe?: string; image?: any; image_alt?: string };

const MD_COLS: Record<number, string> = { 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4', 5: 'md:grid-cols-5' };

export function ProcessSteps({ fields, page }: { fields: any; page: PageJson }) {
  const steps: Step[] = Array.isArray(fields?.steps) ? fields.steps.filter((s: any) => s?.title) : [];
  if (steps.length === 0) return null;
  const t = resolveTheme(page.brand);
  const surface: Surface = fields.surface ?? 'alt';
  const cols = Math.min(Math.max(steps.length, 2), 5);
  return (
    <section className="px-6 py-16 md:px-12" style={{ background: surfaceBg(t, surface), color: t.text }}>
      <div className="mx-auto max-w-5xl">
        {fields.heading && <h2>{fields.heading}</h2>}
        <ol className={`mt-8 grid list-none gap-8 p-0 ${MD_COLS[cols] ?? 'md:grid-cols-3'}`}>
          {steps.map((s, i) => {
            const src = imgSrc(s.image);
            return (
              <li key={i} className="text-center">
                {src && (
                  <div className="mb-5 overflow-hidden rounded-xl">
                    <Image src={src} alt={imgAlt(s.image, s.image_alt)} width={400} height={260} />
                  </div>
                )}
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full" style={{ background: t.lineAccent, border: `1px solid ${t.accent}` }}>
                  <span className="text-sm font-bold" style={{ color: t.accent }}>{s.number ?? i + 1}</span>
                </div>
                <h3 className="mt-4 text-base font-medium">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: t.text3 }}>{s.body}</p>
                {s.timeframe && <p className="mt-2 text-xs font-medium" style={{ color: t.accent }}>{s.timeframe}</p>}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
