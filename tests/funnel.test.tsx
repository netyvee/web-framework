import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { EnquiryFunnel } from '../src/sections/EnquiryFunnel';
import {
  validateFunnel,
  buildEnquiryUrl,
  FUNNEL_EVENTS,
  type FunnelSchema,
} from '../src/conversion/funnel';
import { withSections, page } from './fixtures';

// A funnel whose FIRST step is an audience gate: candidate routes OUT to a recruitment
// destination; client continues into the (client) enquiry funnel. Neutral fixtures only.
const audienceSchema: FunnelSchema = {
  division: 'test',
  source: 'homepage',
  steps: [
    {
      id: 'audience',
      question: 'Who are you?',
      type: 'audience',
      options: [
        { value: 'client', label: 'I need to hire staff' },
        { value: 'candidate', label: 'I am looking for work', route_to: '/careers/test' },
      ],
    },
    {
      id: 'cover_type',
      question: 'What cover do you need?',
      type: 'choice',
      options: [
        { value: 'day', label: 'Day' },
        { value: 'night', label: 'Night' },
      ],
    },
  ],
  completion: { headline: 'Tell us more', cta_label: 'Request support' },
};

function renderFunnel(schema: Partial<FunnelSchema>): string {
  return renderToStaticMarkup(
    <EnquiryFunnel fields={schema} page={withSections([])} />,
  );
}

describe('funnel contract — audience gate (Q1.P3)', () => {
  it('validateFunnel accepts a well-formed audience gate', () => {
    expect(validateFunnel(audienceSchema)).toEqual([]);
  });

  it('rejects an audience step with no route-out branch', () => {
    const bad: FunnelSchema = {
      ...audienceSchema,
      steps: [
        {
          id: 'audience',
          question: 'Who are you?',
          type: 'audience',
          options: [
            { value: 'client', label: 'Client' },
            { value: 'also_client', label: 'Also client' },
          ],
        },
      ],
    };
    expect(validateFunnel(bad)).toContain(
      'step[0] (audience) needs >= 1 option with route_to (route-out branch)',
    );
  });

  it('rejects an audience step with no continue branch (all options route out)', () => {
    const bad: FunnelSchema = {
      ...audienceSchema,
      steps: [
        {
          id: 'audience',
          question: 'Who are you?',
          type: 'audience',
          options: [
            { value: 'a', label: 'A', route_to: '/a' },
            { value: 'b', label: 'B', route_to: '/b' },
          ],
        },
      ],
    };
    expect(validateFunnel(bad)).toContain(
      'step[0] (audience) needs >= 1 option without route_to (continue branch)',
    );
  });

  it('still accepts a plain choice-only funnel (backward compatible)', () => {
    const choiceOnly: FunnelSchema = {
      division: 'test',
      steps: [
        {
          id: 's1',
          question: 'Pick',
          type: 'choice',
          options: [
            { value: 'a', label: 'A' },
            { value: 'b', label: 'B' },
          ],
        },
      ],
      completion: { headline: 'Done' },
    };
    expect(validateFunnel(choiceOnly)).toEqual([]);
  });
});

describe('EnquiryFunnel render — audience gate route-out', () => {
  const html = renderFunnel(audienceSchema);

  it('renders the audience step as a group (not a radiogroup)', () => {
    expect(html).toContain('role="group"');
    expect(html).not.toContain('role="radiogroup"');
    expect(html).toContain('Who are you?');
  });

  it('renders the route-out option as a real anchor to the recruitment destination', () => {
    expect(html).toContain('href="/careers/test"');
    expect(html).toContain('I am looking for work');
  });

  it('renders the continue option as a button (advances the funnel, not a link)', () => {
    expect(html).toContain('I need to hire staff');
    // The continue branch is a <button>, and the ONLY route-out anchor is the candidate one.
    expect(html).toContain('<button');
    expect(html.match(/href="\/careers\/test"/g)?.length).toBe(1);
  });

  it('suppresses the bottom client-enquiry CTA on the audience gate (no candidate bypass)', () => {
    // The client enquiry hand-off URL must NOT appear while the audience gate is shown.
    const enquiryUrl = page.nap.enquiry_url;
    expect(html).not.toContain(`href="${enquiryUrl}`);
  });

  it('a choice-first funnel still shows the radiogroup + bottom CTA (unchanged)', () => {
    const choiceHtml = renderFunnel({
      division: 'test',
      steps: [
        {
          id: 's1',
          question: 'Pick',
          type: 'choice',
          options: [
            { value: 'a', label: 'A' },
            { value: 'b', label: 'B' },
          ],
        },
      ],
      completion: { headline: 'Done' },
    });
    expect(choiceHtml).toContain('role="radiogroup"');
    expect(choiceHtml).toContain(`href="${page.nap.enquiry_url}`);
  });
});

describe('funnel attribution (unchanged by the gate)', () => {
  it('buildEnquiryUrl carries division + source + intent as query metadata', () => {
    const url = buildEnquiryUrl(
      'https://crm.example.invalid/enquire/test',
      'test',
      { audience: 'client', cover_type: 'day' },
      'homepage',
    );
    expect(url).toContain('division=test');
    expect(url).toContain('source=homepage');
    expect(url).toContain('audience=client');
    expect(url).toContain('cover_type=day');
  });

  it('exposes the audience route-out analytics event name', () => {
    expect(FUNNEL_EVENTS.audience).toBe('vigil:funnel_audience');
  });
});
