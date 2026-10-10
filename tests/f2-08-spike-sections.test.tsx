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

describe('service_grid: optional visible heading (F2-08 final parity correction)', () => {
  it('renders the heading as an h2 above the grid when present', () => {
    const html = render([{ type: 'service_grid', fields: { heading: 'Our services', items: [{ title: 'T', body: 'B' }] } }]);
    expect(html).toContain('<h2');
    expect(html).toContain('Our services');
    expect(html.indexOf('Our services')).toBeLessThan(html.indexOf('<h3'));
  });

  it('omitted ⇒ no h2 and the section wraps the grid exactly as before', () => {
    const html = render([{ type: 'service_grid', fields: { items: [{ title: 'T', body: 'B' }] } }]);
    expect(html).not.toContain('<h2');
    expect(html).toMatch(/<section[^>]*class="px-6 py-16"[^>]*><div class="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">/);
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

describe('compliance_strip: optional visible heading (F2-08 closure)', () => {
  it('renders the heading label above the chips when present', () => {
    const html = render([{ type: 'compliance_strip', fields: { heading: 'Regulatory compliance', items: ['DBS Enhanced'] } }]);
    expect(html).toContain('Regulatory compliance');
    expect(html).toContain('DBS Enhanced');
  });

  it('omitted ⇒ byte-identical to the pre-closure markup (section is the flex row itself)', () => {
    const html = render([{ type: 'compliance_strip', fields: { items: ['DBS Enhanced'] } }]);
    expect(html).toContain('<section aria-label="Compliance and assurance" class="flex flex-wrap justify-center gap-5 border-y');
    expect(html).not.toContain('Regulatory compliance');
  });
});

describe('case_study (new section type — labelled Challenge/Solution/Result narrative)', () => {
  it('renders an optional visible section heading above the card (F2-08 closure)', () => {
    const html = render([{ type: 'case_study', fields: { heading: 'Client case study', title: 'T', challenge: 'c' } }]);
    expect(html).toContain('<h2');
    expect(html).toContain('Client case study');
  });

  it('heading omitted ⇒ no h2 rendered', () => {
    const html = render([{ type: 'case_study', fields: { title: 'T', challenge: 'c' } }]);
    expect(html).not.toContain('<h2');
  });

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

describe('cta_new_tab: optional primary-CTA new-tab behaviour (F2-08 canary)', () => {
  const h = (fields: any) => render([{ type: 'hero', fields: { heading: 'H', cta_label: 'Go', cta_url: 'https://crm.example.invalid/e', ...fields } }]);
  const c = (fields: any) => render([{ type: 'cta', fields: { heading: 'H', cta_label: 'Go', cta_url: 'https://crm.example.invalid/e', ...fields } }]);
  it('hero and cta: target=_blank + rel=noopener noreferrer on the primary CTA only', () => {
    for (const html of [h({ cta_new_tab: true, cta_secondary_label: 'Call', cta_secondary_url: 'tel:1' }), c({ cta_new_tab: true, cta_secondary_label: 'Call', cta_secondary_url: 'tel:1' }), h({ cta_new_tab: true }), c({ cta_new_tab: true })]) {
      expect(html.match(/target="_blank"/g)).toHaveLength(1);
      expect(html).toContain('rel="noopener noreferrer"');
      expect(html).not.toMatch(/href="tel:1"[^>]*target=/);
    }
  });
  it('omitted ⇒ no target/rel attributes (byte-identical)', () => {
    for (const html of [h({}), c({}), h({ cta_secondary_label: 'Call', cta_secondary_url: 'tel:1' }), c({ cta_secondary_label: 'Call', cta_secondary_url: 'tel:1' })]) {
      expect(html).not.toContain('target=');
      expect(html).not.toContain('rel=');
    }
  });
});

describe('F2-08 canary: locations_coverage.sub, cta.fine_print, region_label', () => {
  it('locations_coverage renders the optional sub line; omitted ⇒ none', () => {
    const w = render([{ type: 'locations_coverage', fields: { heading: 'Coverage', sub: 'Serving London', locations: [{ label: 'Barnet' }] } }]);
    expect(w).toContain('Serving London');
    const wo = render([{ type: 'locations_coverage', fields: { heading: 'Coverage', locations: [{ label: 'Barnet' }] } }]);
    expect(wo).not.toContain('<p');
  });
  it('cta renders optional fine_print; omitted ⇒ none', () => {
    expect(render([{ type: 'cta', fields: { heading: 'H', cta_label: 'Go', cta_url: '/e', fine_print: 'Reg. 123' } }])).toContain('Reg. 123');
    expect(render([{ type: 'cta', fields: { heading: 'H', cta_label: 'Go', cta_url: '/e' } }])).not.toContain('opacity-40');
  });
  it('region_label wraps the section in a named region; omitted ⇒ no wrapper', () => {
    const w = render([{ type: 'quick_answer', fields: { region_label: 'Quick answer', text: 'T' } }]);
    expect(w).toContain('<div role="region" aria-label="Quick answer"><section');
    const wo = render([{ type: 'quick_answer', fields: { text: 'T' } }]);
    expect(wo).not.toContain('role="region"');
  });
});

describe('text_image: no empty <h2> on the additive blocks path (F2-08 canary)', () => {
  const blocks = [{ type: 'paragraph', content: ['P'] }];
  it('blocks + no heading ⇒ no h2', () => {
    expect(render([{ type: 'text_image', fields: { heading: '', blocks } }])).not.toContain('<h2');
    expect(render([{ type: 'text_image', fields: { blocks } }])).not.toContain('<h2');
  });
  it('blocks + heading ⇒ h2 rendered', () => {
    expect(render([{ type: 'text_image', fields: { heading: 'H', blocks } }])).toContain('<h2 class="text-3xl font-medium">H</h2>');
  });
  it('legacy flat path unchanged (h2 always rendered)', () => {
    expect(render([{ type: 'text_image', fields: { heading: '', body: 'B' } }])).toContain('<h2 class="text-3xl font-medium"></h2>');
    expect(render([{ type: 'text_image', fields: { heading: 'H', body: 'B' } }])).toContain('<h2 class="text-3xl font-medium">H</h2>');
  });
});
