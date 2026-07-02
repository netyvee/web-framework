// F1A/V0.2 DEMONSTRATION SURFACE — gallery index.
// Renders the design tokens + EVERY section through the REAL framework registry
// (RenderSections) — so the gallery IS production output. Neutral identity only.
import { RenderSections, resolveTheme } from '@vigil/web-framework';
import { demoPage, withSections, librarySections } from '@/lib/neutral';

const t = resolveTheme(demoPage.brand);

const swatches: [string, string][] = [
  [t.bg, 'bg'], [t.bgAlt, 'bg-alt'], [t.bgCard, 'bg-card'],
  [t.bgDeep, 'bg-deep'], [t.accent, 'accent'], [t.secondary, 'secondary'],
];

export default function Gallery() {
  return (
    <main style={{ ...(t.cssVars as any) }}>
      <header className="border-b px-6 py-10 md:px-12" style={{ borderColor: t.line }}>
        <span className="vf-overline" style={{ color: t.accent }}>@vigil/web-framework · v0.2</span>
        <h1 className="mt-3">Demonstration surface</h1>
        <p className="mt-3 max-w-2xl" style={{ color: t.text3 }}>
          Design-system tokens + every section rendered through the REAL registry
          (production components, not gallery copies). Neutral placeholder identity.
        </p>
        <a href="/archetype/homepage" className="mt-6 inline-block rounded-lg px-6 py-3 font-medium" style={{ background: t.accent, color: t.onAccent }}>
          View the division-homepage archetype →
        </a>
      </header>

      <div className="px-6 py-6 md:px-12" style={{ background: t.bgDeep }}>
        <span className="text-[11px] font-medium uppercase tracking-widest" style={{ color: t.text4 }}>Design tokens — colour</span>
        <div className="mt-4 flex flex-wrap gap-4">
          {swatches.map(([hex, label]) => (
            <div key={label} className="text-center">
              <div className="h-16 w-24 rounded-lg" style={{ background: hex, border: `1px solid ${t.line}` }} />
              <div className="mt-1 text-[11px]" style={{ color: t.text4 }}>{label}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 space-y-3">
          <h1>Heading one — shared scale</h1>
          <h2>Heading two</h2>
          <h3>Heading three</h3>
          <span className="vf-overline" style={{ color: t.accent }}>Overline section tag</span>
        </div>
      </div>

      {/* Every library + nucleus section, through the real registry */}
      <RenderSections page={withSections(librarySections)} />
    </main>
  );
}
