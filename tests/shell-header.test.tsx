// @vitest-environment jsdom
// v1.27.0 (netyvee/app#344): Shell `header` is optional and default-off; it restyles the header only, never page.brand.
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { Shell } from '../src/shell/Shell';
import { page, nav } from './fixtures';

afterEach(cleanup);
const withLogo = { ...nav, logo: { src: '/brand/vigil-lockup-navy.svg', alt: 'Vigil', footerSrc: '/logo-white.svg' } };
const headerEl = (c: HTMLElement) => c.querySelector('header') as HTMLElement;

describe('Shell header option', () => {
  it('omitted: header uses page.brand, no label', () => {
    const { container } = render(<Shell page={page} nav={withLogo}>x</Shell>);
    expect(screen.queryByText('Care')).toBeNull();
    expect(headerEl(container).getAttribute('style') ?? '').toContain('background: rgb(10, 22, 40)');
  });
  it('header.brand restyles the header only; page background stays page.brand', () => {
    const { container } = render(
      <Shell page={page} nav={withLogo} header={{ brand: { bg: '#ffffff', text: '#0a1628', cta: '#4ecdc4', secondary: '#0f8f86' }, logoLabel: 'Care', logoHeight: 40, logoLabelCollapse: true }}>x</Shell>,
    );
    expect(headerEl(container).getAttribute('style') ?? '').toContain('background: rgb(255, 255, 255)');
    expect(screen.getAllByText('Care')[0]).toBeTruthy();
    expect(container.querySelector('img')?.getAttribute('height')).toBe('40');
    expect((container.firstElementChild as HTMLElement).style.background).toContain('10, 22, 40');
  });
});
