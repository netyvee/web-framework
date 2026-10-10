// F2-08 service-page archetype spike (netyvee/app#344) — the small additive
// section-library gaps the capability review found when mapping Cleaning's
// bespoke ServicePageData/ServicePage archetype onto the shared framework.
// Each change is additive/optional; the "byte-identical when omitted" half of
// every case is asserted alongside the new behaviour.
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { RenderSections } from '../src/sections/registry';
import { withSections } from './fixtures';

const render = (sections: any[]) => renderToStaticMarkup(<RenderSections page={withSections(sections)} />);

describe('text_image: optional blocks (structured intro content beside an image)', () => {
  it('renders structured blocks instead of flat body when present', () => {
    const html = render([
      {
        type: 'text_image',
        fields: {
          heading: 'Intro',
          blocks: [
            { type: 'paragraph', content: ['First paragraph.'] },
            { type: 'paragraph', content: ['Second paragraph.'] },
          ],
          image: { url: 'https://res.cloudinary.com/x/intro.jpg', alt: 'Intro image' },
        },
      },
    ]);
    expect(html).toContain('First paragraph.');
    expect(html).toContain('Second paragraph.');
    expect(html).toContain('alt="Intro image"');
  });

  it('omitted ⇒ byte-identical flat-body markup (unchanged for every existing consumer)', () => {
    const html = render([{ type: 'text_image', fields: { heading: 'H', body: 'Flat body text.' } }]);
    expect(html).toContain('<p class="mt-4 opacity-80">Flat body text.</p>');
    expect(html).not.toContain('First paragraph');
  });
});

describe('service_grid: optional icon (no-image cards)', () => {
  it('renders the icon glyph when the item has no image', () => {
    const html = render([{ type: 'service_grid', fields: { items: [{ icon: '🏢', title: 'Office cleaning', body: 'Scheduled programme.' }] } }]);
    expect(html).toContain('🏢');
  });

  it('image takes precedence over icon when both are present', () => {
    const html = render([
      { type: 'service_grid', fields: { items: [{ icon: '🏢', image: { url: 'https://res.cloudinary.com/x/svc.jpg', alt: 'a' }, title: 'T', body: 'B' }] } },
    ]);
    expect(html).toContain('<img');
    expect(html).not.toContain('🏢');
  });

  it('omitted ⇒ byte-identical to before (no icon, no image)', () => {
    const html = render([{ type: 'service_grid', fields: { items: [{ title: 'T', body: 'B' }] } }]);
    expect(html).not.toContain('aria-hidden');
  });
});

describe('cta: optional secondary CTA', () => {
  it('renders both CTAs when the secondary pair is present', () => {
    const html = render([
      { type: 'cta', fields: { heading: 'Ready?', cta_label: 'Enquire', cta_url: 'https://crm.example.invalid/enquire', cta_secondary_label: 'Call us', cta_secondary_url: 'tel:+442000000000' } },
    ]);
    expect(html).toContain('Enquire');
    expect(html).toContain('Call us');
    expect(html).toContain('tel:+442000000000');
  });

  it('omitted ⇒ byte-identical single-CTA markup', () => {
    const html = render([{ type: 'cta', fields: { heading: 'Ready?', cta_label: 'Enquire', cta_url: '/enquire' } }]);
    expect(html).toContain('Enquire');
    expect(html).not.toContain('Call us');
  });
});

describe('differentiation_panel: optional per-item stat', () => {
  it('renders the stat line when present', () => {
    const html = render([{ type: 'differentiation_panel', fields: { items: [{ title: 'Directly employed', body: 'Not agency staff.', stat: '100% direct employment' }] } }]);
    expect(html).toContain('100% direct employment');
  });

  it('omitted ⇒ byte-identical (no stat line)', () => {
    const html = render([{ type: 'differentiation_panel', fields: { items: [{ title: 'T', body: 'B' }] } }]);
    expect(html).not.toContain('font-medium" style="color:');
  });
});

describe('case_study (new section type — labelled Challenge/Solution/Result narrative)', () => {
  it('renders title, labelled parts, sector/borough and image', () => {
    const html = render([
      {
        type: 'case_study',
        fields: {
          title: 'How Vigil solved X',
          challenge: 'The challenge text.',
          solution: 'The solution text.',
          result: 'The result text.',
          sector: 'Managed office',
          borough: 'Shoreditch',
          image: { url: 'https://res.cloudinary.com/x/case.jpg', alt: 'Case study' },
        },
      },
    ]);
    expect(html).toContain('How Vigil solved X');
    expect(html).toContain('The challenge text.');
    expect(html).toContain('The solution text.');
    expect(html).toContain('The result text.');
    expect(html).toContain('Managed office');
    expect(html).toContain('Shoreditch');
    expect(html).toContain('alt="Case study"');
  });

  it('renders nothing without a title (CRM/data guard, matches every other section\'s empty-state convention)', () => {
    const html = render([{ type: 'case_study', fields: { challenge: 'x' } }]);
    expect(html).toBe('');
  });
});
