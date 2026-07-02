// F1A demo implementations of the NEW section-library types (SECTION-LIBRARY.md
// §10–20) + hero variants. These are GALLERY-GRADE demonstrations — the visual
// contract the v0.2 framework components must match — not shipped framework code.
// All content is neutral placeholder identity.

const enquiry = 'https://crm.example.invalid/enquire/demo';
const phone = '020 0000 0000';

export function ImagePlaceholder({ ratio = '1200/628', label = 'image slot' }: { ratio?: string; label?: string }) {
  return (
    <div
      className="flex w-full items-center justify-center overflow-hidden rounded-xl border"
      style={{ aspectRatio: ratio, background: 'var(--vf-bg-card)', borderColor: 'var(--vf-line-accent)' }}
    >
      <span className="text-xs" style={{ color: 'var(--vf-text-4)' }}>{label} ({ratio})</span>
    </div>
  );
}

// SECTION-LIBRARY §1 — hero_split with trust chips + CTA pair + quick answer
export function HeroSplitDemo() {
  return (
    <section className="px-6 py-16 md:px-12" style={{ background: 'var(--vf-bg)' }}>
      <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
        <div>
          <span className="vf-overline">Field services</span>
          <h1 className="mt-3">Planned support, <em>delivered on schedule</em></h1>
          <p className="mt-4 max-w-xl" style={{ color: 'var(--vf-text-3)' }}>
            Vetted, directly employed operatives on an agreed rota — with reporting you can show your auditors.
          </p>
          <div className="mt-4 rounded-r border-l-2 p-4 text-sm" style={{ borderColor: 'var(--vf-accent)', background: 'rgba(78,205,196,0.10)', color: 'var(--vf-text-2)' }}>
            Horizon provides scheduled field support across the demo region: recurring visits, trained cover
            and documented outcomes under one rolling agreement.
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {['Directly employed', 'Reference-checked', 'Insured', 'Regional coverage'].map((c) => (
              <span key={c} className="vf-chip">{c}</span>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <a href={enquiry} className="vf-btn-primary">Request a quote</a>
            <a href={`tel:${phone.replace(/\s+/g, '')}`} className="vf-btn-outline">Call {phone}</a>
          </div>
        </div>
        <ImagePlaceholder label="hero image" />
      </div>
    </section>
  );
}

// §10 trust_badge_row
export function TrustBadgeRow() {
  const items = [
    { stat: '✓', label: 'Directly employed staff' },
    { stat: '✓', label: 'Reference-checked' },
    { stat: '£—', label: 'Insurance documentation available' },
    { stat: '⏱', label: 'Responsive communication' },
  ];
  return (
    <div className="overflow-x-auto border-y px-6 py-5 md:px-12" style={{ borderColor: 'var(--vf-line-accent)' }}>
      <div className="flex min-w-max justify-center gap-8 md:min-w-0">
        {items.map((it) => (
          <div key={it.label} className="flex shrink-0 items-center gap-2">
            <span className="text-[13px] font-medium" style={{ color: 'var(--vf-accent)' }}>{it.stat}</span>
            <span className="text-xs" style={{ color: 'var(--vf-text-3)' }}>{it.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// §11 metrics_strip (verified-numbers rule applies to real sites)
export function MetricsStrip() {
  const items = [
    { value: '12', label: 'service lines' },
    { value: '4', label: 'coverage zones' },
    { value: '7yr', label: 'operating history' },
    { value: '100%', label: 'documented visits' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4" style={{ background: 'var(--vf-bg)' }}>
      {items.map((it, i) => (
        <div key={it.label} className="px-4 py-5 text-center" style={i < items.length - 1 ? { borderRight: '1px solid rgba(78,205,196,0.10)' } : undefined}>
          <div className="text-[26px] font-bold" style={{ color: 'var(--vf-accent)' }}>{it.value}</div>
          <div className="text-[11px] leading-tight" style={{ color: 'var(--vf-text-5)' }}>{it.label}</div>
        </div>
      ))}
    </div>
  );
}

// §12 proof_strip
export function ProofStrip() {
  const items = ['Offices', 'Venues', 'Logistics', 'Education', 'Retail', 'Healthcare-adjacent'];
  return (
    <div className="border-y px-6 py-8 md:px-12" style={{ borderColor: 'var(--vf-line)', background: 'var(--vf-bg)' }}>
      <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-6">
        {items.map((s) => (
          <span key={s} className="text-[13px]" style={{ color: 'var(--vf-text-3)' }}>{s}</span>
        ))}
      </div>
    </div>
  );
}

// §13 compliance_strip
export function ComplianceStrip() {
  const items = ['Employment-law compliant', 'Insured operations', 'Documented training', 'Site-induction standard'];
  return (
    <div className="flex flex-wrap justify-center gap-5 border-y px-6 py-4 md:px-12" style={{ background: 'var(--vf-bg-deep)', borderColor: 'rgba(78,205,196,0.08)' }}>
      {items.map((it) => (
        <span key={it} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--vf-text-4)' }}>
          <span style={{ color: 'var(--vf-accent)' }}>✓</span>
          {it}
        </span>
      ))}
    </div>
  );
}

// §14 differentiation_panel
export function DifferentiationPanel() {
  const items = [
    { icon: '👥', title: 'Our people, not agencies', body: 'Directly employed operatives with continuity on your account.' },
    { icon: '🗂', title: 'Evidence by default', body: 'Every visit produces a record you can retrieve later.' },
    { icon: '📞', title: 'Reachable', body: 'A named contact and responsive communication as standard.' },
    { icon: '🧭', title: 'Local knowledge', body: 'Zoned teams that know the sites they serve.' },
  ];
  return (
    <section className="border-b px-6 py-16 md:px-12" style={{ background: 'var(--vf-bg)', borderColor: 'var(--vf-line)' }}>
      <div className="mx-auto max-w-5xl">
        <span className="vf-overline">Why Horizon</span>
        <h2 className="mt-3">Built for accountable delivery</h2>
        <div className="mt-8 grid gap-3 md:grid-cols-2">
          {items.map((it) => (
            <div key={it.title} className="rounded-xl p-5" style={{ background: 'var(--vf-bg-card)', border: '1px solid var(--vf-line)' }}>
              <h3 className="flex items-center gap-2 text-sm font-medium">
                <span style={{ color: 'var(--vf-accent)' }}>{it.icon}</span>
                {it.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--vf-text-3)' }}>{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// §15 process_steps
export function ProcessSteps() {
  const steps = [
    { n: 1, title: 'Scope', body: 'A short call to understand sites, cadence and standards.', time: 'Day 1' },
    { n: 2, title: 'Match & induct', body: 'We assign and induct the right operatives for your sites.', time: 'Within days' },
    { n: 3, title: 'Deliver & report', body: 'Visits run to rota with documented outcomes each time.', time: 'Ongoing' },
  ];
  return (
    <section className="px-6 py-16 md:px-12" style={{ background: 'var(--vf-bg-alt)' }}>
      <div className="mx-auto max-w-5xl">
        <h2>How it works</h2>
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full" style={{ background: 'rgba(78,205,196,0.10)', border: '1px solid var(--vf-accent)' }}>
                <span className="text-sm font-bold" style={{ color: 'var(--vf-accent)' }}>{s.n}</span>
              </div>
              <h3 className="mt-4 text-base font-medium">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--vf-text-3)' }}>{s.body}</p>
              <p className="mt-2 text-xs font-medium" style={{ color: 'var(--vf-accent)' }}>{s.time}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// §16 quick_answer (standalone)
export function QuickAnswer() {
  return (
    <section className="px-6 py-8 md:px-12" style={{ background: 'var(--vf-bg)' }}>
      <div className="mx-auto max-w-4xl rounded-r border-l-2 p-5 text-sm" style={{ borderColor: 'var(--vf-accent)', background: 'rgba(78,205,196,0.10)', color: 'var(--vf-text-2)' }}>
        <strong style={{ color: 'var(--vf-accent)' }}>Quick answer:</strong> Horizon supplies scheduled,
        documented field support across the demo region under a single rolling agreement — vetted,
        directly employed staff with a named point of contact.
      </div>
    </section>
  );
}

// §17 locations_coverage
export function LocationsCoverage() {
  const live = ['Sampletown', 'Exampleford', 'Testbury', 'Demoham'];
  const soon = ['Northfield', 'Placeholder Vale'];
  return (
    <section id="coverage" className="border-b px-6 py-16 md:px-12" style={{ background: 'var(--vf-bg)', borderColor: 'var(--vf-line)' }}>
      <div className="mx-auto max-w-5xl">
        <h2>Where we work</h2>
        <div className="mt-6 flex flex-wrap gap-2">
          {live.map((b) => (
            <a key={b} href="#coverage" className="rounded-full px-3 py-1 text-xs font-medium" style={{ color: 'var(--vf-accent)', background: 'rgba(78,205,196,0.07)', border: '1px solid rgba(78,205,196,0.25)' }}>{b}</a>
          ))}
          {soon.map((b) => (
            <span key={b} className="rounded-full px-3 py-1 text-xs" style={{ color: 'var(--vf-text-5)', border: '1px solid var(--vf-line)' }}>{b}</span>
          ))}
        </div>
        <a href="#coverage" className="mt-5 inline-block text-[13px] font-medium" style={{ color: 'var(--vf-accent)' }}>View all coverage →</a>
      </div>
    </section>
  );
}

// §20 contact_block
export function ContactBlock() {
  return (
    <section className="px-6 py-16 text-center md:px-12" style={{ background: 'var(--vf-bg-alt)' }}>
      <div className="mx-auto max-w-3xl">
        <h2>Talk to us</h2>
        <p className="mt-3" style={{ color: 'var(--vf-text-3)' }}>
          Call <a href={`tel:${phone.replace(/\s+/g, '')}`} style={{ color: 'var(--vf-secondary)' }}>{phone}</a> or
          email <a href="mailto:hello@horizon.example" style={{ color: 'var(--vf-secondary)' }}>hello@horizon.example</a>
        </p>
        <p className="mt-1 text-xs" style={{ color: 'var(--vf-text-5)' }}>Weekdays 08:00–18:00</p>
        <a href={enquiry} className="vf-btn-primary mt-6">Request a quote</a>
      </div>
    </section>
  );
}

// §5 cta v2 — the CTA pair / final CTA
export function CtaPair() {
  return (
    <section className="border-y px-6 py-16 text-center md:px-12" style={{ background: 'var(--vf-bg-card)', borderColor: 'rgba(78,205,196,0.25)' }}>
      <div className="mx-auto max-w-2xl">
        <h2>Ready to put your schedule on rails?</h2>
        <p className="mb-8 mt-3 text-[15px]" style={{ color: 'var(--vf-text-3)' }}>
          No commitment · takes minutes · a real person follows up
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a href={enquiry} className="vf-btn-primary">Request a quote</a>
          <a href={`tel:${phone.replace(/\s+/g, '')}`} className="vf-btn-outline">Call {phone}</a>
        </div>
      </div>
    </section>
  );
}

// §18 enquiry_funnel — STATIC representation of the reserved funnel contract
// (choice grid + progress + reassurance). The functional component is a later
// major build (see SECTION-LIBRARY §18).
export function FunnelMock() {
  return (
    <section className="px-6 py-10 md:px-12" style={{ background: 'var(--vf-bg)' }}>
      <div className="mx-auto max-w-lg rounded-2xl p-6" style={{ background: 'var(--vf-bg-card)', border: '1px solid rgba(78,205,196,0.20)' }}>
        <div className="flex items-baseline justify-between">
          <h3 className="text-base font-bold">What do you need cover for?</h3>
          <span className="text-xs" style={{ color: 'var(--vf-accent)' }}>Takes 2 minutes</span>
        </div>
        <div className="mt-3 h-1 w-full overflow-hidden rounded" style={{ background: 'var(--vf-line)' }}>
          <div className="h-1 rounded" style={{ width: '33%', background: 'var(--vf-accent)' }} />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {['🏢 Offices', '🏟 Venues', '🚚 Logistics', '🏫 Education'].map((o) => (
            <button key={o} className="rounded-[11px] p-4 text-left text-sm" style={{ background: 'var(--vf-bg)', border: '1px solid var(--vf-line)' }}>{o}</button>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <span className="vf-chip">No commitment</span>
            <span className="vf-chip">{phone}</span>
          </div>
          <a href={enquiry} className="vf-btn-primary px-4 py-2 text-sm">Continue →</a>
        </div>
      </div>
    </section>
  );
}
