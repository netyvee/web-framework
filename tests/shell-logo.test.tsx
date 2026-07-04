import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Shell, pickLogoSrc } from '../src/shell/Shell';
import { isDarkSurface } from '../src/tokens/theme';
import { page, nav } from './fixtures';
import type { SiteNav } from '../src/types';

// Q1.P3 pt2 — surface-aware logo pick (nav.logo.darkSrc). The header/mobile-nav/
// footer chrome is a dark surface on every Vigil site, so a supplied darkSrc (a
// light logo) must win there; absent darkSrc the pick is byte-identical to before.

describe('pickLogoSrc — surface-aware logo pick', () => {
  const full = { src: '/logo.png', alt: 'X', footerSrc: '/logo-footer.png', darkSrc: '/logo-dark.png' };

  it('header on a dark surface prefers darkSrc', () => {
    expect(pickLogoSrc(full, 'dark', 'header')).toBe('/logo-dark.png');
  });
  it('header on a light surface uses the default src', () => {
    expect(pickLogoSrc(full, 'light', 'header')).toBe('/logo.png');
  });
  it('footer-specific footerSrc wins over darkSrc on a dark surface', () => {
    expect(pickLogoSrc(full, 'dark', 'footer')).toBe('/logo-footer.png');
  });
  it('footer on a dark surface falls back to darkSrc when there is no footerSrc', () => {
    expect(pickLogoSrc({ src: '/logo.png', alt: 'X', darkSrc: '/logo-dark.png' }, 'dark', 'footer')).toBe('/logo-dark.png');
  });
  it('BACKWARD-COMPAT: no darkSrc ⇒ header uses src, footer uses footerSrc ?? src (pre-v0.4.9 behaviour)', () => {
    const legacy = { src: '/logo.png', alt: 'X', footerSrc: '/logo-footer.png' };
    expect(pickLogoSrc(legacy, 'dark', 'header')).toBe('/logo.png');
    expect(pickLogoSrc(legacy, 'dark', 'footer')).toBe('/logo-footer.png');
    const noFooter = { src: '/logo.png', alt: 'X' };
    expect(pickLogoSrc(noFooter, 'dark', 'footer')).toBe('/logo.png');
  });
  it('no logo configured ⇒ undefined (falls through to the brandName text logo)', () => {
    expect(pickLogoSrc(undefined, 'dark', 'header')).toBeUndefined();
  });
});

describe('isDarkSurface — deterministic luminance', () => {
  it('navy estate background is dark', () => {
    expect(isDarkSurface('#0a1628')).toBe(true);
  });
  it('the footer surface (#0f1f3d) is dark', () => {
    expect(isDarkSurface('#0f1f3d')).toBe(true);
  });
  it('white is light', () => {
    expect(isDarkSurface('#ffffff')).toBe(false);
  });
  it('an unparseable value defaults to dark (estate assumption, never breaks render)', () => {
    expect(isDarkSurface('not-a-hex')).toBe(true);
  });
});

describe('Shell — renders the surface-aware logo', () => {
  const withDarkLogo: SiteNav = {
    ...nav,
    logo: { src: '/logo.png', alt: 'Test Trading Co', footerSrc: '/logo-footer.png', darkSrc: '/logo-dark.png' },
  };

  it('renders darkSrc in the (dark) header and footerSrc in the footer', () => {
    const html = renderToStaticMarkup(<Shell page={page} nav={withDarkLogo}><div /></Shell>);
    // navy header ⇒ dark logo variant present
    expect(html).toContain('/logo-dark.png');
    // footer slot keeps its explicit footer asset
    expect(html).toContain('/logo-footer.png');
  });

  it('darkSrc drives the footer when no footerSrc is set', () => {
    const nav2: SiteNav = { ...nav, logo: { src: '/logo.png', alt: 'Test Trading Co', darkSrc: '/logo-dark.png' } };
    const html = renderToStaticMarkup(<Shell page={page} nav={nav2}><div /></Shell>);
    expect(html).toContain('/logo-dark.png');
    expect(html).not.toContain('/logo.png"'); // src is never used on the dark chrome
  });

  it('BACKWARD-COMPAT: without darkSrc the header shows src and footer shows footerSrc', () => {
    const html = renderToStaticMarkup(<Shell page={page} nav={nav}><div /></Shell>);
    // fixtures.nav.logo = { src: '/logo-test.png', footerSrc: '/logo-test-white.png' }
    expect(html).toContain('/logo-test.png');
    expect(html).toContain('/logo-test-white.png');
  });
});
