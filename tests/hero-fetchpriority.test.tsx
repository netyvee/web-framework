// v1.25.1 - Hero passes fetchPriority="high" explicitly, so the LCP hint survives Next 16 (where `priority` no longer sets it).
// next/image is mocked in this suite (tests/mocks/next-image.tsx forwards fetchPriority only when passed): this proves the prop is
// passed; the rendered attribute on a real Next build is proven by the site canary diff.
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Hero } from '../src/sections/Hero';
import { page } from './fixtures';

const render = (fields: any) => renderToStaticMarkup(<Hero fields={fields} page={page} />);
const imgTag = (html: string) => (html.match(/<img\b[^>]*>/i) ?? [''])[0];

describe('hero image LCP hint', () => {
  it('standard layout: the <img> carries fetchpriority="high"', () => {
    const tag = imgTag(render({ heading: 'H', image: '/hero.jpg', image_alt: 'a hero' }));
    expect(tag).toMatch(/fetchPriority="high"/i);
  });
  it('split layout: the <img> carries fetchpriority="high"', () => {
    const tag = imgTag(render({ heading: 'H', layout: 'split', image: '/hero.jpg', image_alt: 'a hero' }));
    expect(tag).toMatch(/fetchPriority="high"/i);
  });
  it('no image: no <img> is rendered', () => {
    expect(render({ heading: 'H' })).not.toContain('<img');
  });
});
