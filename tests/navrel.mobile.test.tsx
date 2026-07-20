// @vitest-environment jsdom
//
// SM-F2 — the FOURTH rendered placement. The mobile navigation is behind `open`
// state, so it never appears in renderToStaticMarkup: every existing shell test
// asserts only against the closed shell, which means the mobile menu's markup has
// never been render-verified at all. A governed link could be dropped there and
// the whole suite would stay green — the "check that cannot fail on the thing it
// is supposed to check" defect class, applied to a placement rather than a value.
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, within, fireEvent } from '@testing-library/react';
import { Shell } from '../src/shell/Shell';
import type { SiteNav } from '../src/types';
import { page, nav } from './fixtures';

const CORPORATE = 'https://example-parent.test/';

const navWithRel: SiteNav = {
  ...nav,
  primary: [...nav.primary, { label: 'Part of Example Group', href: CORPORATE, rel: 'corporate_parent' }],
};

afterEach(cleanup);

describe('Shell mobile nav — declared link metadata', () => {
  it('carries data-vf-rel into the opened mobile menu', () => {
    render(<Shell page={page} nav={navWithRel}><div /></Shell>);
    fireEvent.click(screen.getByLabelText('Open menu'));

    const menu = within(document.getElementById('vf-mobile-nav')!);
    const link = menu.getByRole('link', { name: 'Part of Example Group' });
    expect(link.getAttribute('data-vf-rel')).toBe('corporate_parent');
    expect(link.getAttribute('rel')).toBeNull();
  });

  it('leaves undeclared mobile links untouched', () => {
    render(<Shell page={page} nav={navWithRel}><div /></Shell>);
    fireEvent.click(screen.getByLabelText('Open menu'));

    const menu = within(document.getElementById('vf-mobile-nav')!);
    for (const l of nav.primary) {
      expect(menu.getByRole('link', { name: l.label }).getAttribute('data-vf-rel')).toBeNull();
    }
  });
});
