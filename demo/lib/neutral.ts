// NEUTRAL placeholder identity for the demonstration surface. Deliberately
// fictional — no division's real NAP, claims, services or copy may appear here
// (division-isolation applies to the demo too).
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

export const demoPage: PageJson = {
  schema_version: 1,
  site: 'demo',
  slug: '/',
  page_type: 'homepage',
  seo: {
    title: 'Demo — Horizon Field Services',
    description: 'Framework demonstration page with neutral placeholder identity.',
    canonical: '/',
    noindex: true,
  },
  brand: { bg: '#0a1628', text: '#ffffff', cta: '#4ecdc4', secondary: '#7fb2d4' },
  nap: {
    phone: '020 0000 0000',
    email: 'hello@horizon.example',
    address: '1 Example Way, Sampletown, EX1 1MP',
    trading_name: 'Horizon Field Services',
    enquiry_url: 'https://crm.example.invalid/enquire/demo',
  },
  sections: [],
};

export const withSections = (sections: PageJson['sections']): PageJson => ({
  ...demoPage,
  sections,
});

// Nucleus-section showcase content (rendered through the REAL framework registry).
export const nucleusSections: PageJson['sections'] = [
  {
    type: 'hero',
    provenance: 'editorial',
    fields: {
      heading: 'A dependable partner for planned field work',
      sub: 'Scheduled visits, vetted staff and clear reporting for organisations across the region.',
      cta_label: 'Request a quote',
      cta_url: 'https://crm.example.invalid/enquire/demo',
    },
  },
  {
    type: 'service_grid',
    fields: {
      items: [
        { title: 'Scheduled visits', body: 'Recurring site visits on an agreed rota with documented outcomes.' },
        { title: 'Site support', body: 'Trained operatives supporting your on-site team when demand peaks.' },
        { title: 'Rapid response', body: 'Short-notice cover for gaps, incidents and seasonal spikes.' },
      ],
    },
  },
  {
    type: 'text_image',
    fields: {
      heading: 'Directly employed, properly vetted',
      body: 'Every operative is employed by us, reference-checked and inducted to your site standards before their first visit.',
    },
  },
  {
    type: 'prose',
    fields: {
      heading: 'A prose block',
      body: 'Long-form migrated body content renders through the prose type — no image slot, reading-width column, quiet vertical rhythm.',
    },
  },
  {
    type: 'testimonial',
    fields: {
      items: [
        { quote: 'Reliable, communicative and easy to work with.', author: 'Operations lead, example client' },
      ],
    },
  },
  {
    type: 'faq',
    fields: {
      items: [
        { q: 'Which areas do you cover?', a: 'The whole demo region, with named coverage per location page.' },
        { q: 'How quickly can you start?', a: 'Typically within days of a confirmed agreement.' },
      ],
    },
  },
  {
    type: 'cta',
    fields: {
      heading: 'Ready to talk it through?',
      sub: 'No commitment — a short call to scope what you need.',
      cta_label: 'Request a quote',
      cta_url: 'https://crm.example.invalid/enquire/demo',
    },
  },
  {
    type: 'borough_block',
    fields: {
      borough: 'Sampletown',
      body: 'Locally staffed coverage for Sampletown with the same standards and reporting.',
    },
  },
  {
    type: 'contact_form',
    fields: { division: 'demo', heading: 'Get in touch' },
  },
];
