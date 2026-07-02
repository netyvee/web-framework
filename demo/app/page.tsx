// F1A DEMONSTRATION SURFACE — gallery index.
// Renders: design tokens · the 9 nucleus sections THROUGH THE REAL FRAMEWORK ·
// gallery-grade demos of every new library section. Neutral identity only.
import { RenderSections } from '@vigil/web-framework';
import { withSections, nucleusSections } from '@/lib/neutral';
import {
  HeroSplitDemo, TrustBadgeRow, MetricsStrip, ProofStrip, ComplianceStrip,
  DifferentiationPanel, ProcessSteps, QuickAnswer, LocationsCoverage,
  ContactBlock, CtaPair, FunnelMock,
} from '@/components/library';
import { FaqAccordion } from '@/components/FaqAccordion';

function GalleryLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-6 pb-2 pt-10 md:px-12" style={{ background: 'var(--vf-bg-deep)' }}>
      <span className="text-[11px] font-medium uppercase tracking-widest" style={{ color: 'var(--vf-text-4)' }}>
        {children}
      </span>
    </div>
  );
}

const swatches: [string, string][] = [
  ['--vf-bg', 'bg'], ['--vf-bg-alt', 'bg-alt'], ['--vf-bg-card', 'bg-card'],
  ['--vf-bg-deep', 'bg-deep'], ['--vf-accent', 'accent'], ['--vf-secondary', 'secondary'],
];

export default function Gallery() {
  return (
    <main>
      <header className="border-b px-6 py-10 md:px-12" style={{ borderColor: 'var(--vf-line)' }}>
        <span className="vf-overline">@vigil/web-framework</span>
        <h1 className="mt-3">Demonstration surface</h1>
        <p className="mt-3 max-w-2xl" style={{ color: 'var(--vf-text-3)' }}>
          The visual contract for the design-system tokens, the section library and the page
          archetypes (netyvee/app FRAMEWORK/, F1A). Neutral placeholder identity throughout.
        </p>
        <a href="/archetype/homepage" className="vf-btn-primary mt-6">
          View the division-homepage archetype →
        </a>
      </header>

      <GalleryLabel>Design tokens — colour</GalleryLabel>
      <div className="flex flex-wrap gap-4 px-6 py-6 md:px-12">
        {swatches.map(([varName, label]) => (
          <div key={varName} className="text-center">
            <div className="h-16 w-24 rounded-lg" style={{ background: `var(${varName})`, border: '1px solid var(--vf-line)' }} />
            <div className="mt-1 text-[11px]" style={{ color: 'var(--vf-text-4)' }}>{label}</div>
          </div>
        ))}
      </div>

      <GalleryLabel>Design tokens — type scale · buttons · chips</GalleryLabel>
      <div className="space-y-4 px-6 py-6 md:px-12">
        <h1>Heading one — Playfair clamp(34–50)</h1>
        <h2>Heading two — clamp(26–36)</h2>
        <h3>Heading three — DM Sans 17</h3>
        <p style={{ color: 'var(--vf-text-3)' }}>Body 15px / 1.8 on text-3.</p>
        <span className="vf-overline">Overline section tag</span>
        <div className="flex flex-wrap items-center gap-4">
          <a href="#" className="vf-btn-primary">Primary button</a>
          <a href="#" className="vf-btn-outline">Outline button</a>
          <a href="#" className="text-sm font-medium" style={{ color: 'var(--vf-accent)' }}>Text link →</a>
          <span className="vf-chip">Trust chip</span>
        </div>
      </div>

      <GalleryLabel>Hero — split variant with trust chips, quick answer, CTA pair</GalleryLabel>
      <HeroSplitDemo />

      <GalleryLabel>Trust badge row (§10) · Metrics strip (§11) · Proof strip (§12) · Compliance strip (§13)</GalleryLabel>
      <TrustBadgeRow />
      <MetricsStrip />
      <ProofStrip />
      <ComplianceStrip />

      <GalleryLabel>Enquiry funnel — reserved contract, static representation (§18)</GalleryLabel>
      <FunnelMock />

      <GalleryLabel>Differentiation panel (§14) · Process steps (§15) · Quick answer (§16)</GalleryLabel>
      <DifferentiationPanel />
      <ProcessSteps />
      <QuickAnswer />

      <GalleryLabel>Locations coverage (§17) · FAQ accordion (§6 v2) · CTA pair (§5 v2) · Contact block (§20)</GalleryLabel>
      <LocationsCoverage />
      <section className="px-6 py-10 md:px-12" style={{ background: 'var(--vf-bg-alt)' }}>
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6">Frequently asked questions</h2>
          <FaqAccordion
            items={[
              { q: 'Is this real content?', a: 'No — neutral placeholder identity; the structure is the contract.' },
              { q: 'Where do the styles come from?', a: 'DESIGN-SYSTEM-CONTRACT v1.0.0 tokens rendered as CSS custom properties.' },
              { q: 'What implements these for real?', a: 'The v0.2 section-library build (next package), verified against this gallery.' },
            ]}
          />
        </div>
      </section>
      <CtaPair />
      <ContactBlock />

      <GalleryLabel>The 9 nucleus sections — rendered through the REAL framework registry (v0.1.x)</GalleryLabel>
      <RenderSections page={withSections(nucleusSections)} />
    </main>
  );
}
