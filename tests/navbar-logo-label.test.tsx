// @vitest-environment jsdom
// v1.26.0 (netyvee/app#344, D-140): NavBar logoHeight / logoLabel / logoLabelCollapse are optional and default-off.
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { NavBar } from '../src/shell/NavBar';
import { page, nav } from './fixtures';

afterEach(cleanup);
const withLogo = { ...nav, logo: { src: '/brand/vigil-lockup.svg', alt: 'Vigil' } };

describe('NavBar logo label', () => {
  it('renders no label and default height when the props are omitted', () => {
    const { container } = render(<NavBar slug={page.slug} brand={page.brand} open={false} onOpenChange={() => {}} nav={withLogo} />);
    expect(screen.queryByText('Cleaning')).toBeNull();
    expect(container.querySelector('img')?.getAttribute('height')).toBe('30');
  });
  it('renders the label after the logo, hairline-separated, with the given height', () => {
    const { container } = render(<NavBar slug={page.slug} brand={page.brand} open={false} onOpenChange={() => {}} nav={withLogo} logoLabel="Cleaning" logoHeight={29} />);
    const label = screen.getAllByText('Cleaning')[0] as HTMLElement;
    expect(label.style.borderLeft).toContain('1px solid');
    expect(label.className).toBe('');
    expect(container.querySelector('img')?.getAttribute('height')).toBe('29');
  });
  it('collapses the label below 1100px when asked', () => {
    render(<NavBar slug={page.slug} brand={page.brand} open={false} onOpenChange={() => {}} nav={withLogo} logoLabel="Care" logoLabelCollapse />);
    expect((screen.getAllByText('Care')[0] as HTMLElement).className).toContain('min-[1100px]:inline');
  });
});
