// PAGE-ARCHETYPES §1 — DIVISION HOMEPAGE, composed end-to-end with the REAL
// framework shell + the demo library sections, in the governed section order.
// Neutral identity. This is what a fully framework-adopted division homepage
// looks like structurally.
import { Header, Footer, MobileCta } from '@vigil/web-framework';
import { demoNav, demoPage } from '@/lib/neutral';
import {
  HeroSplitDemo, ProofStrip, TrustBadgeRow, MetricsStrip, DifferentiationPanel,
  ComplianceStrip, LocationsCoverage, CtaPair, ContactBlock, FunnelMock,
} from '@/components/library';
import { FaqAccordion } from '@/components/FaqAccordion';

export const metadata = { title: 'Archetype — Division homepage (neutral demo)' };

export default function ArchetypeHomepage() {
  return (
    <div className="flex min-h-screen flex-col" style={{ background: 'var(--vf-bg)', color: 'var(--vf-text)' }}>
      <Header page={demoPage} nav={demoNav} />
      <main className="flex-1">
        <HeroSplitDemo />
        <ProofStrip />
        <TrustBadgeRow />
        <FunnelMock />
        <MetricsStrip />
        <section id="about" className="border-b px-6 py-16 md:px-12" style={{ borderColor: 'var(--vf-line)' }}>
          <div className="mx-auto max-w-5xl">
            <span className="vf-overline">Who we are</span>
            <h2 className="mt-3">An operations partner, not a supplier</h2>
            <p className="mt-4 max-w-3xl" style={{ color: 'var(--vf-text-3)' }}>
              Horizon exists to make planned field work uneventful: the right people arrive on
              schedule, do documented work, and someone answers when you call.
            </p>
          </div>
        </section>
        <section id="services" className="px-6 py-16 md:px-12" style={{ background: 'var(--vf-bg-alt)' }}>
          <div className="mx-auto max-w-5xl">
            <h2>What we do</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ['🧰', 'Scheduled visits', 'Recurring site visits on an agreed rota.'],
                ['🤝', 'Site support', 'Trained operatives alongside your team.'],
                ['⚡', 'Rapid response', 'Short-notice cover for gaps and spikes.'],
                ['📋', 'Audits & checks', 'Walkthroughs with documented findings.'],
                ['🌙', 'Out-of-hours', 'Evening and weekend scheduling.'],
                ['📦', 'Projects', 'One-off mobilisations, planned properly.'],
              ].map(([icon, title, body]) => (
                <a key={title} href="#services" className="group block rounded-xl p-5" style={{ background: 'var(--vf-bg-card)', border: '1px solid rgba(78,205,196,0.10)' }}>
                  <div className="mb-3 text-[26px]">{icon}</div>
                  <h3 className="text-sm font-medium transition-colors group-hover:text-[var(--vf-accent)]">{title}</h3>
                  <p className="mt-1 text-xs" style={{ color: 'var(--vf-text-4)' }}>{body}</p>
                  <span className="mt-2 inline-block text-xs font-medium" style={{ color: 'var(--vf-accent)' }}>Learn more →</span>
                </a>
              ))}
            </div>
          </div>
        </section>
        <DifferentiationPanel />
        <ComplianceStrip />
        <LocationsCoverage />
        <section className="px-6 py-16 md:px-12" style={{ background: 'var(--vf-bg-alt)' }}>
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6">Frequently asked questions</h2>
            <FaqAccordion
              items={[
                { q: 'How quickly can you start?', a: 'Typically within days of a confirmed agreement.' },
                { q: 'Are your staff employed or agency?', a: 'Directly employed by Horizon, with continuity on your account.' },
                { q: 'Which areas do you cover?', a: 'The demo region — see the coverage section for named zones.' },
              ]}
            />
          </div>
        </section>
        <CtaPair />
        <ContactBlock />
      </main>
      <Footer page={demoPage} nav={demoNav} />
      <MobileCta page={demoPage} nav={demoNav} />
    </div>
  );
}
