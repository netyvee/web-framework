import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { RenderSections, SECTION_TYPES } from '../src/sections/registry';
import { page, withSections } from './fixtures';

const render = (sections: any[]) =>
  renderToStaticMarkup(<RenderSections page={withSections(sections)} />);

describe('section registry', () => {
  it('exposes the v0.2 library + v0.6.1 gateway: 9 nucleus + 10 library + 1 gateway type', () => {
    expect(SECTION_TYPES.sort()).toEqual(
      [
        // nucleus (v0.1.x)
        'borough_block', 'contact_form', 'cta', 'faq', 'hero', 'prose', 'service_grid', 'testimonial', 'text_image',
        // library (v0.2)
        'trust_badge_row', 'metrics_strip', 'proof_strip', 'compliance_strip', 'differentiation_panel',
        'process_steps', 'quick_answer', 'locations_coverage', 'contact_block', 'enquiry_funnel',
        // governed corporate→division gateway (v0.6.1)
        'division_gateway',
      ].sort()
    );
  });

  it('throws loudly on an unknown section type outside production', () => {
    expect(() => render([{ type: 'not_a_type', fields: {} }])).toThrow('Unknown section type: not_a_type');
  });

  it('hero renders h1 + optional CTA + image with alt from the canonical contract', () => {
    const html = render([
      {
        type: 'hero',
        fields: {
          heading: 'The H1',
          sub: 'Sub line',
          cta_label: 'Go',
          cta_url: '/go',
          image: { url: 'https://res.cloudinary.com/x/img.jpg', alt: 'Canonical alt' },
        },
      },
    ]);
    expect(html).toContain('<h1');
    expect(html).toContain('The H1');
    expect(html).toContain('href="/go"');
    expect(html).toContain('alt="Canonical alt"');
  });

  it('service_grid + faq + testimonial render repeating items', () => {
    const html = render([
      { type: 'service_grid', fields: { items: [{ title: 'Svc A', body: 'Body A' }] } },
      { type: 'faq', fields: { items: [{ q: 'Q1?', a: 'A1' }] } },
      { type: 'testimonial', fields: { items: [{ quote: 'Great', author: 'A. Person' }] } },
    ]);
    for (const s of ['Svc A', 'Q1?', 'A1', 'Great', 'A. Person']) expect(html).toContain(s);
  });

  it('service_grid: internal href makes a card a link; hrefless card stays a plain div (v0.4.0 parity)', () => {
    const linked = render([
      { type: 'service_grid', fields: { items: [{ title: 'Tower Hamlets', body: 'Cover here', href: '/care-staff-agency-tower-hamlets' }] } },
    ]);
    expect(linked).toContain('href="/care-staff-agency-tower-hamlets"');
    expect(linked).toContain('Learn more');
    // hrefless card: no anchor, no "Learn more" affordance → byte-parity with v0.3.x consumers (Care)
    const plain = render([
      { type: 'service_grid', fields: { items: [{ title: 'Svc A', body: 'Body A' }] } },
    ]);
    expect(plain).not.toContain('<a ');
    expect(plain).not.toContain('Learn more');
  });

  it('prose renders body, skips cleanly when empty (staffing provenance)', () => {
    expect(render([{ type: 'prose', fields: { heading: 'P', body: 'Prose body' } }])).toContain('Prose body');
    expect(render([{ type: 'prose', fields: {} }])).toBe('');
  });

  it('contact_form carries the page NAP phone and enquiry URL — never anything else', () => {
    const html = render([{ type: 'contact_form', fields: { division: 'test' } }]);
    expect(html).toContain('020 0000 0000');
    expect(html).toContain('tel:02000000000');
    expect(html).toContain(page.nap.enquiry_url);
  });

  it('imgSrc accepts the legacy bare-string image shape', () => {
    const html = render([
      { type: 'text_image', fields: { heading: 'T', body: 'B', image: 'https://res.cloudinary.com/x/y.jpg', image_alt: 'Sibling alt' } },
    ]);
    expect(html).toContain('src="https://res.cloudinary.com/x/y.jpg"');
    expect(html).toContain('alt="Sibling alt"');
  });
});
