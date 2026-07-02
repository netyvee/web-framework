import { describe, it, expect } from 'vitest';
import { paramsToFile, imgSrc, imgAlt } from '../src/loader';

describe('loader utilities', () => {
  it('paramsToFile: homepage <-> index, nested <-> __ joined', () => {
    expect(paramsToFile([])).toBe('index');
    expect(paramsToFile(['a'])).toBe('a');
    expect(paramsToFile(['a', 'b'])).toBe('a__b');
  });

  it('imgSrc reads both canonical-object and legacy-string shapes', () => {
    expect(imgSrc('https://x/y.jpg')).toBe('https://x/y.jpg');
    expect(imgSrc({ url: 'https://x/z.jpg', alt: 'a' })).toBe('https://x/z.jpg');
    expect(imgSrc(null)).toBeNull();
    expect(imgSrc({})).toBeNull();
  });

  it('imgAlt prefers the canonical object alt, falls back to sibling', () => {
    expect(imgAlt({ url: 'u', alt: 'obj alt' }, 'sib')).toBe('obj alt');
    expect(imgAlt({ url: 'u' }, 'sib')).toBe('sib');
    expect(imgAlt('https://x/y.jpg', 'sib')).toBe('sib');
    expect(imgAlt(null)).toBe('');
  });
});
