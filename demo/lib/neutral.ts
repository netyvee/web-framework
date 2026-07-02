// NEUTRAL placeholder identity for the demonstration surface. Deliberately
// fictional — no division's real NAP/claims/services (division-isolation applies
// to the demo too). Every section here renders through the REAL framework registry,
// so the gallery IS the production output (V0.2 §7).
import type { PageJson, SiteNav } from '@vigil/web-framework';

export const demoNav: SiteNav = {
  brandName: 'Horizon Field Services',
  primary: [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '#services' },
    { label: 'Coverage', href: '#coverage' },
    { label: 'About', href: '#about' },
  ],
  footer: [
    {
      heading: 'Services',
      links: [
        { label: 'Scheduled visits', href: '#services' },
        { label: 'Site support', href: '#services' },
        { label: 'Rapid response', href: '#services' },
      ],
    },
  ],
  companyReg: 'Company Reg. 00000000',
  enquiryCtaLabel: 'Request a quote',
};

const brand = { bg: '#0a1628', text: '#ffffff', cta: '#4ecdc4', secondary: '#7fb2d4' };
const nap = {
  phone: '020 0000 0000',
  email: 'hello@horizon.example',
  address: '1 Example Way, Sampletown, EX1 1MP',
  trading_name: 'Horizon Field Services',
  enquiry_url: 'https://crm.example.invalid/enquire/demo',
};

export const demoPage: PageJson = {
  schema_version: 1, site: 'demo', slug: '/', page_type: 'homepage',
  seo: { title: 'Demo — Horizon Field Services', description: 'Framework demonstration.', canonical: '/', noindex: true, schema_type: 'Service' },
  brand, nap, sections: [],
};

export const withSections = (sections: PageJson['sections']): PageJson => ({ ...demoPage, sections });

// One of every LIBRARY section, rendered through the real registry (the gallery).
export const librarySections: PageJson['sections'] = [
  { type: 'hero', provenance: 'framework_enhancement', fields: { layout: 'split', overline: 'Field services', heading: 'Planned support, delivered on schedule', sub: 'Vetted, directly employed operatives on an agreed rota — with reporting you can show your auditors.', quick_answer: 'Horizon provides scheduled field support across the demo region under one rolling agreement.', trust_chips: ['Directly employed', 'Reference-checked', 'Insured', 'Regional coverage'], cta_label: 'Request a quote', cta_url: nap.enquiry_url, cta_secondary_label: 'Call 020 0000 0000', cta_secondary_url: 'tel:02000000000' } },
  { type: 'trust_badge_row', provenance: 'framework_enhancement', fields: { items: [{ stat: '✓', label: 'Directly employed staff' }, { stat: '✓', label: 'Reference-checked' }, { stat: '⏱', label: 'Responsive communication' }, { stat: '£—', label: 'Insurance available' }] } },
  { type: 'enquiry_funnel', provenance: 'framework_enhancement', fields: { division: 'demo', source: 'gallery', heading: 'Takes 2 minutes', reassurance: ['No commitment', '020 0000 0000'], steps: [{ id: 'need', question: 'What do you need cover for?', type: 'choice', options: [{ value: 'offices', label: '🏢 Offices' }, { value: 'venues', label: '🏟 Venues' }, { value: 'logistics', label: '🚚 Logistics' }, { value: 'education', label: '🏫 Education' }] }], completion: { headline: 'Great — let’s scope it', note: 'A short call to confirm the detail.', cta_label: 'Continue to enquiry' } } },
  { type: 'metrics_strip', provenance: 'framework_enhancement', fields: { items: [{ value: '12', label: 'service lines' }, { value: '4', label: 'coverage zones' }, { value: '7yr', label: 'operating history' }, { value: '100%', label: 'documented visits' }] } },
  { type: 'proof_strip', provenance: 'framework_enhancement', fields: { items: ['Offices', 'Venues', 'Logistics', 'Education', 'Retail', 'Healthcare-adjacent'] } },
  { type: 'differentiation_panel', provenance: 'framework_enhancement', fields: { overline: 'Why Horizon', heading: 'Built for accountable delivery', items: [{ icon: '👥', title: 'Our people, not agencies', body: 'Directly employed operatives with continuity on your account.' }, { icon: '🗂', title: 'Evidence by default', body: 'Every visit produces a record you can retrieve later.' }, { icon: '📞', title: 'Reachable', body: 'A named contact and responsive communication.' }, { icon: '🧭', title: 'Local knowledge', body: 'Zoned teams that know their sites.' }] } },
  { type: 'process_steps', provenance: 'framework_enhancement', fields: { heading: 'How it works', steps: [{ number: 1, title: 'Scope', body: 'A short call to understand sites and cadence.', timeframe: 'Day 1' }, { number: 2, title: 'Match & induct', body: 'We assign and induct the right operatives.', timeframe: 'Within days' }, { number: 3, title: 'Deliver & report', body: 'Visits run to rota with documented outcomes.', timeframe: 'Ongoing' }] } },
  { type: 'quick_answer', provenance: 'framework_enhancement', fields: { label: 'Quick answer:', text: 'Horizon supplies scheduled, documented field support across the demo region under a single rolling agreement.' } },
  { type: 'compliance_strip', provenance: 'framework_enhancement', fields: { items: ['Employment-law compliant', 'Insured operations', 'Documented training', 'Site-induction standard'] } },
  { type: 'locations_coverage', provenance: 'framework_enhancement', fields: { heading: 'Where we work', locations: [{ label: 'Sampletown', href: '#coverage' }, { label: 'Exampleford', href: '#coverage' }, { label: 'Testbury', href: '#coverage' }, 'Northfield', 'Placeholder Vale'], view_all_label: 'View all coverage', view_all_url: '#coverage' } },
  { type: 'testimonial', provenance: 'framework_enhancement', fields: { items: [{ quote: 'Reliable, communicative and easy to work with.', author: 'Operations lead, example client' }] } },
  { type: 'faq', provenance: 'framework_enhancement', fields: { variant: 'accordion', items: [{ q: 'Which areas do you cover?', a: 'The whole demo region, with named coverage per location.' }, { q: 'How quickly can you start?', a: 'Typically within days of a confirmed agreement.' }] } },
  { type: 'cta', provenance: 'framework_enhancement', fields: { heading: 'Ready to talk it through?', sub: 'No commitment — a short call to scope what you need.', cta_label: 'Request a quote', cta_url: nap.enquiry_url } },
  { type: 'contact_block', provenance: 'framework_enhancement', fields: { heading: 'Talk to us', hours: 'Weekdays 08:00–18:00', cta_label: 'Request a quote' } },
];

// A full DIVISION-HOMEPAGE archetype, neutral, through the real registry + shell.
export const archetypeHomepage: PageJson['sections'] = [
  { type: 'hero', provenance: 'framework_enhancement', fields: { layout: 'split', overline: 'Field services', heading: 'A dependable partner for planned field work', sub: 'Scheduled visits, vetted staff and clear reporting for organisations across the region.', trust_chips: ['Directly employed', 'Reference-checked', 'Insured'], cta_label: 'Request a quote', cta_url: nap.enquiry_url, cta_secondary_label: 'Call 020 0000 0000', cta_secondary_url: 'tel:02000000000' } },
  { type: 'trust_badge_row', provenance: 'framework_enhancement', fields: { items: [{ stat: '✓', label: 'Directly employed' }, { stat: '✓', label: 'Reference-checked' }, { stat: '⏱', label: 'Responsive' }] } },
  { type: 'enquiry_funnel', provenance: 'framework_enhancement', fields: { division: 'demo', source: 'homepage', heading: 'Takes 2 minutes', reassurance: ['No commitment'], steps: [{ id: 'need', question: 'What do you need cover for?', type: 'choice', options: [{ value: 'offices', label: '🏢 Offices' }, { value: 'venues', label: '🏟 Venues' }, { value: 'logistics', label: '🚚 Logistics' }, { value: 'education', label: '🏫 Education' }] }], completion: { headline: 'Let’s scope it', cta_label: 'Continue' } } },
  { type: 'text_image', provenance: 'framework_enhancement', fields: { heading: 'An operations partner, not a supplier', body: 'Horizon exists to make planned field work uneventful: the right people arrive on schedule, do documented work, and someone answers when you call.' } },
  { type: 'service_grid', provenance: 'framework_enhancement', fields: { items: [{ icon: '🧰', title: 'Scheduled visits', body: 'Recurring site visits on an agreed rota.', href: '#services' }, { icon: '🤝', title: 'Site support', body: 'Trained operatives alongside your team.', href: '#services' }, { icon: '⚡', title: 'Rapid response', body: 'Short-notice cover for gaps and spikes.', href: '#services' }] } },
  { type: 'differentiation_panel', provenance: 'framework_enhancement', fields: { overline: 'Why Horizon', heading: 'Built for accountable delivery', items: [{ icon: '👥', title: 'Our people', body: 'Directly employed, with continuity.' }, { icon: '🗂', title: 'Evidence by default', body: 'A record for every visit.' }] } },
  { type: 'process_steps', provenance: 'framework_enhancement', fields: { heading: 'How it works', steps: [{ number: 1, title: 'Scope', body: 'A short call.' }, { number: 2, title: 'Match', body: 'We assign and induct.' }, { number: 3, title: 'Deliver', body: 'Visits run to rota.' }] } },
  { type: 'compliance_strip', provenance: 'framework_enhancement', fields: { items: ['Employment-law compliant', 'Insured operations', 'Site-induction standard'] } },
  { type: 'locations_coverage', provenance: 'framework_enhancement', fields: { heading: 'Where we work', locations: [{ label: 'Sampletown', href: '#coverage' }, { label: 'Exampleford', href: '#coverage' }, 'Northfield'] } },
  { type: 'faq', provenance: 'framework_enhancement', fields: { variant: 'accordion', items: [{ q: 'How quickly can you start?', a: 'Typically within days.' }, { q: 'Employed or agency?', a: 'Directly employed.' }] } },
  { type: 'cta', provenance: 'framework_enhancement', fields: { heading: 'Ready to put your schedule on rails?', sub: 'No commitment — a short call to scope what you need.', cta_label: 'Request a quote', cta_url: nap.enquiry_url } },
  { type: 'contact_block', provenance: 'framework_enhancement', fields: { heading: 'Talk to us', hours: 'Weekdays 08:00–18:00' } },
];
