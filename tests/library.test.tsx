import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { RenderSections } from '../src/sections/registry';
import { page, withSections } from './fixtures';

const render = (sections: any[]) => renderToStaticMarkup(<RenderSections page={withSections(sections)} />);

// Every v0.2 library section: renders content when populated, renders NOTHING on
// empty-state, and (colour from page.brand fixtures) leaks no real division value.
describe('v0.2 library components', () => {
  it('trust_badge_row renders items and nothing when empty', () => {
    expect(render([{ type: 'trust_badge_row', fields: { items: [{ label: 'Directly employed' }] } }])).toContain('Directly employed');
    expect(render([{ type: 'trust_badge_row', fields: { items: [] } }])).toBe('');
  });

  it('metrics_strip renders values + labels, empty→nothing', () => {
    const html = render([{ type: 'metrics_strip', fields: { items: [{ value: '12', label: 'services' }] } }]);
    expect(html).toContain('12');
    expect(html).toContain('services');
    expect(render([{ type: 'metrics_strip', fields: {} }])).toBe('');
  });

  it('proof_strip accepts string[] or {label}[]', () => {
    expect(render([{ type: 'proof_strip', fields: { items: ['Offices', 'Venues'] } }])).toContain('Offices');
    expect(render([{ type: 'proof_strip', fields: { items: [{ label: 'Retail' }] } }])).toContain('Retail');
  });

  it('compliance_strip renders check items', () => {
    expect(render([{ type: 'compliance_strip', fields: { items: ['DBS-checked', 'Directly employed'] } }])).toContain('DBS-checked');
  });

  it('differentiation_panel renders value cards, empty→nothing', () => {
    const html = render([{ type: 'differentiation_panel', fields: { heading: 'Why us', items: [{ title: 'People', body: 'Directly employed' }] } }]);
    expect(html).toContain('Why us');
    expect(html).toContain('People');
    expect(render([{ type: 'differentiation_panel', fields: { items: [] } }])).toBe('');
  });

  it('process_steps renders numbered steps', () => {
    const html = render([{ type: 'process_steps', fields: { heading: 'How it works', steps: [{ title: 'Call', body: 'Scope' }, { title: 'Match', body: 'Assign' }] } }]);
    expect(html).toContain('How it works');
    expect(html).toContain('Call');
    expect(html).toMatch(/<ol/);
  });

  it('quick_answer renders text, empty→nothing', () => {
    expect(render([{ type: 'quick_answer', fields: { text: 'A concise answer.' } }])).toContain('A concise answer.');
    expect(render([{ type: 'quick_answer', fields: {} }])).toBe('');
  });

  it('locations_coverage renders linked + unlinked pills', () => {
    const html = render([{ type: 'locations_coverage', fields: { heading: 'Coverage', locations: [{ label: 'Hackney', href: '/hackney' }, 'Greater London'] } }]);
    expect(html).toContain('Hackney');
    expect(html).toContain('href="/hackney"');
    expect(html).toContain('Greater London');
  });

  it('contact_block uses page NAP phone + enquiry url (never a literal)', () => {
    const html = render([{ type: 'contact_block', fields: { heading: 'Talk to us' } }]);
    expect(html).toContain(page.nap.phone);
    expect(html).toContain('tel:' + page.nap.phone.replace(/\s+/g, ''));
    expect(html).toContain(page.nap.enquiry_url);
  });

  it('faq accordion variant renders buttons with aria-expanded; list variant stays a dl', () => {
    const acc = render([{ type: 'faq', fields: { variant: 'accordion', items: [{ q: 'Q1', a: 'A1' }] } }]);
    expect(acc).toContain('aria-expanded');
    expect(acc).toContain('Q1');
    const list = render([{ type: 'faq', fields: { items: [{ q: 'Q2', a: 'A2' }] } }]);
    expect(list).toContain('<dl');
    expect(list).not.toContain('aria-expanded');
  });

  it('hero split variant renders a 2-col grid + trust chips + secondary CTA', () => {
    const html = render([{
      type: 'hero',
      fields: {
        layout: 'split', heading: 'H', sub: 'S',
        cta_label: 'Primary', cta_url: '/x',
        cta_secondary_label: 'Call', cta_secondary_url: 'tel:020',
        trust_chips: ['DBS-checked'], quick_answer: 'Quick.',
      },
    }]);
    expect(html).toContain('md:grid-cols-2');
    expect(html).toContain('DBS-checked');
    expect(html).toContain('Primary');
    expect(html).toContain('Call');
    expect(html).toContain('Quick.');
  });

  it('enquiry_funnel renders the first choice step + progress; invalid schema → nothing', () => {
    const html = render([{
      type: 'enquiry_funnel',
      fields: {
        division: 'demo', heading: 'Takes 2 min', reassurance: ['No commitment'],
        steps: [{ id: 'need', question: 'What do you need?', type: 'choice', options: [{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }] }],
        completion: { headline: 'Nearly there', cta_label: 'Continue' },
      },
    }]);
    expect(html).toContain('What do you need?');
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('progressbar');
    // invalid (no steps) → nothing
    expect(render([{ type: 'enquiry_funnel', fields: { division: 'demo', steps: [], completion: { headline: 'x' } } }])).toBe('');
  });
});
