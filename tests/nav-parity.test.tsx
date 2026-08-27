// @vitest-environment jsdom
//
// F2-B1 (netyvee/app#344): Cleaning-vs-framework Nav parity primitive. Covers the
// four additive NavLink fields (icon, description, columns, footerLink) added
// because plain-text F2-B0 dropdowns could not faithfully represent Cleaning's
// accepted, already-live navigation (icon-bearing menu grids, per-item
// descriptions, 2-column layout, a visually-separated "view all" link) — see
// types.ts's NavLink doc comment for exactly which field renders where. Also
// covers the aria-current fix on FLAT top-level links (a real, small correctness
// gap this same parity review found: only dropdown children had it before).
//
// Everything here is opt-in per NavLink; tests/nested-nav.test.tsx's own "flat-nav
// consumers are unaffected" suite (still green, unmodified) is the proof that
// omitting these fields is byte-identical to before.
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, within, fireEvent } from '@testing-library/react';
import { Shell } from '../src/shell/Shell';
import { NavBar } from '../src/shell/NavBar';
import type { SiteNav } from '../src/types';
import { page, nav } from './fixtures';

afterEach(cleanup);

const SERVICES_WITH_PARITY_FIELDS = {
  label: 'Services',
  href: '/services',
  columns: 2 as const,
  footerLink: { label: 'View all services →', href: '/services' },
  mobileFooterLink: { label: 'View all →', href: '/services' },
  children: [
    { label: 'Office Cleaning', href: '/office-cleaning', icon: '🏢', description: 'Daily and contract office cleans' },
    { label: 'Healthcare Cleaning', href: '/healthcare-cleaning', icon: '🏥', description: 'Compliant clinical-grade cleaning' },
  ],
};

function navWithParityDropdown(): SiteNav {
  return { ...nav, primary: [...nav.primary, SERVICES_WITH_PARITY_FIELDS] };
}

function openDesktopMenu() {
  render(<Shell page={page} nav={navWithParityDropdown()}><div /></Shell>);
  const primary = within(screen.getByRole('navigation', { name: 'Primary' }));
  fireEvent.click(primary.getByRole('button', { name: /Services/ }));
  return within(screen.getByRole('menu', { name: 'Services' }));
}

function openMobileMenu() {
  fireEvent.click(screen.getByLabelText('Open menu'));
  const root = within(document.getElementById('vf-mobile-nav')!);
  fireEvent.click(root.getByRole('button', { name: /Services/ }));
  return root;
}

describe('Desktop dropdown — icon, description, columns, footerLink', () => {
  it('renders each child’s icon and description', () => {
    const menu = openDesktopMenu();
    expect(menu.getByText('🏢')).toBeTruthy();
    expect(menu.getByText('Daily and contract office cleans')).toBeTruthy();
    expect(menu.getByText('🏥')).toBeTruthy();
    expect(menu.getByText('Compliant clinical-grade cleaning')).toBeTruthy();
  });

  it('applies a 2-column grid class to the menu list when columns: 2 is set on the parent', () => {
    render(<Shell page={page} nav={navWithParityDropdown()}><div /></Shell>);
    const primary = within(screen.getByRole('navigation', { name: 'Primary' }));
    fireEvent.click(primary.getByRole('button', { name: /Services/ }));
    const menu = screen.getByRole('menu', { name: 'Services' });
    const list = menu.querySelector('ul')!;
    expect(list.className).toContain('grid-cols-2');
  });

  it('renders footerLink in a visually separated block, distinct from the children list', () => {
    render(<Shell page={page} nav={navWithParityDropdown()}><div /></Shell>);
    const primary = within(screen.getByRole('navigation', { name: 'Primary' }));
    fireEvent.click(primary.getByRole('button', { name: /Services/ }));
    const menu = screen.getByRole('menu', { name: 'Services' });
    const list = menu.querySelector('ul')!;
    // role="menuitem" (not the default "link"): assistive tech walking this
    // role="menu" container must see a real menu item here, not a plain link.
    const footer = screen.getByRole('menuitem', { name: 'View all services →' });
    // the footer link is NOT one of the <ul> children's <li role="none"> entries
    expect(list.contains(footer)).toBe(false);
    expect(menu.contains(footer)).toBe(true);
  });

  it('omits columns/footerLink markup entirely when unset (a plain F2-B0 dropdown, unaffected)', () => {
    render(<Shell page={page} nav={{ ...nav, primary: [...nav.primary, { label: 'Locations', href: '/locations', children: [{ label: 'Camden', href: '/camden' }] }] }}><div /></Shell>);
    const primary = within(screen.getByRole('navigation', { name: 'Primary' }));
    fireEvent.click(primary.getByRole('button', { name: /Locations/ }));
    const menu = screen.getByRole('menu', { name: 'Locations' });
    const list = menu.querySelector('ul')!;
    expect(list.className).not.toContain('grid-cols-2');
    expect(screen.queryByText(/view all/i)).toBeNull();
  });
});

describe('Mobile accordion — icon and footerLink (no description, per accepted design)', () => {
  it('renders each child’s icon but NOT its description', () => {
    render(<Shell page={page} nav={navWithParityDropdown()}><div /></Shell>);
    const menu = openMobileMenu();
    expect(menu.getByText('🏢')).toBeTruthy();
    expect(menu.queryByText('Daily and contract office cleans')).toBeNull();
  });

  it('renders mobileFooterLink (not footerLink) in the accordion panel when both are set', () => {
    // F2-B3: the mobile accordion's footer link can carry different wording
    // from the desktop dropdown's (Cleaning's accepted design uses the
    // shorter "View all →" on mobile vs. "View all services →" on desktop).
    render(<Shell page={page} nav={navWithParityDropdown()}><div /></Shell>);
    const menu = openMobileMenu();
    expect(menu.getByRole('link', { name: 'View all →' })).toBeTruthy();
    expect(menu.queryByRole('link', { name: 'View all services →' })).toBeNull();
  });

  it('falls back to footerLink on mobile when mobileFooterLink is unset', () => {
    const nav = navWithParityDropdown();
    const services = nav.primary.find((l) => l.label === 'Services')!;
    delete (services as { mobileFooterLink?: unknown }).mobileFooterLink;
    render(<Shell page={page} nav={nav}><div /></Shell>);
    const menu = openMobileMenu();
    expect(menu.getByRole('link', { name: 'View all services →' })).toBeTruthy();
  });
});

describe('Desktop dropdown footerLink — menu semantics (Codex review)', () => {
  it('exposes footerLink with role="menuitem", not a plain link, inside the role="menu" container', () => {
    const menu = openDesktopMenu();
    expect(menu.queryByRole('link', { name: 'View all services →' })).toBeNull();
    expect(menu.getByRole('menuitem', { name: 'View all services →' })).toBeTruthy();
  });
});

describe('NavBar standalone — focus-ring CSS vars (Codex review)', () => {
  it('sets --vf-focus/--vf-accent on its own wrapper, so focus rings resolve even without Shell', () => {
    const { container } = render(
      <NavBar nav={nav} slug={page.slug} brand={page.brand} open={false} onOpenChange={() => {}} />
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.getPropertyValue('--vf-focus')).toBe(page.brand.cta);
    expect(wrapper.style.getPropertyValue('--vf-accent')).toBe(page.brand.cta);
  });
});

describe('Flat top-level links — aria-current parity fix', () => {
  it('marks the flat link matching page.slug with aria-current="page" on desktop', () => {
    // fixtures: page.slug === '/' and nav.primary[0] === { label: 'Home', href: '/' }
    render(<Shell page={page} nav={nav}><div /></Shell>);
    const primary = within(screen.getByRole('navigation', { name: 'Primary' }));
    expect(primary.getByRole('link', { name: 'Home' }).getAttribute('aria-current')).toBe('page');
    expect(primary.getByRole('link', { name: 'Widgets' }).getAttribute('aria-current')).toBeNull();
  });

  it('marks the flat link matching page.slug with aria-current="page" on mobile', () => {
    render(<Shell page={page} nav={nav}><div /></Shell>);
    fireEvent.click(screen.getByLabelText('Open menu'));
    const mobile = within(document.getElementById('vf-mobile-nav')!);
    expect(mobile.getByRole('link', { name: 'Home' }).getAttribute('aria-current')).toBe('page');
    expect(mobile.getByRole('link', { name: 'Widgets' }).getAttribute('aria-current')).toBeNull();
  });
});
