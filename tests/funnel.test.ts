import { describe, it, expect } from 'vitest';
import { validateFunnel, buildEnquiryUrl } from '../src/conversion/funnel';

describe('conversion funnel contract (V0.2 §5)', () => {
  it('validateFunnel flags missing division, steps, options, completion', () => {
    const errs = validateFunnel({ steps: [{ id: 's', question: 'q', type: 'choice', options: [{ value: 'a', label: 'A' }] }] } as any);
    expect(errs.join(' ')).toMatch(/division/);
    expect(errs.join(' ')).toMatch(/>= 2 options/);
    expect(errs.join(' ')).toMatch(/completion/);
  });

  it('validateFunnel passes a valid schema', () => {
    expect(validateFunnel({
      division: 'care',
      steps: [{ id: 'need', question: 'q', type: 'choice', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] }],
      completion: { headline: 'done' },
    })).toHaveLength(0);
  });

  it('buildEnquiryUrl carries division + source + intent as query metadata', () => {
    const url = buildEnquiryUrl('https://app.example/enquire/care', 'care', { need: 'companionship' }, 'homepage');
    expect(url).toContain('https://app.example/enquire/care?');
    expect(url).toContain('division=care');
    expect(url).toContain('source=homepage');
    expect(url).toContain('need=companionship');
  });

  it('buildEnquiryUrl appends with & when the base already has a query', () => {
    const url = buildEnquiryUrl('https://x/e?ref=1', 'care', {}, undefined);
    expect(url).toContain('?ref=1&division=care');
  });
});
