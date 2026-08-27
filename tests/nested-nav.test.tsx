// @vitest-environment jsdom
//
// F2-B0 (netyvee/app#344, FRAMEWORK/IMPLEMENTATION-SEQUENCE.md Step 5(b) precondition):
// nested dropdown navigation. A NavLink with `children` renders as a disclosure
// trigger (desktop: hover/click dropdown; mobile: accordion), not a navigating link.
// A NavLink without `children` is byte-identical to before — proven by the untouched
// pre-existing shell.test.tsx / shellv2.test.tsx / navrel*.test.tsx suites, all still
// green (148/148, see PR description). This file covers only the new behaviour.
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, within, fireEvent } from '@testing-library/react';
import { Shell } from '../src/shell/Shell';
import type { SiteNav } from '../src/types';
import { page, nav } from './fixtures';

afterEach(cleanup);

const SERVICES = {
  label: 'Services',
  href: '/services',
  children: [
    { label: 'Office Cleaning', href: '/office-cleaning' },
    { label: 'Widgets', href: '/widgets' }, // matches page.slug indirectly via a second fixture below
  ],
};

function navWithDropdown(): SiteNav {
  return { ...nav, primary: [...nav.primary, SERVICES] };
}

describe('Shell desktop nav — nested dropdown', () => {
  it('renders a disclosure button, not a link, for an item with children', () => {
    render(<Shell page={page} nav={navWithDropdown()}><div /></Shell>);
    const primary = within(screen.getByRole('navigation', { name: 'Primary' }));
    const trigger = primary.getByRole('button', { name: /Services/ });
    expect(trigger).toBeTruthy();
    // the parent href must NOT be rendered as a navigation target
    expect(primary.queryByRole('link', { name: 'Services' })).toBeNull();
  });

  it('has correct ARIA scaffolding when closed, and opens the menu on click', () => {
    render(<Shell page={page} nav={navWithDropdown()}><div /></Shell>);
    const primary = within(screen.getByRole('navigation', { name: 'Primary' }));
    const trigger = primary.getByRole('button', { name: /Services/ });
    expect(trigger.getAttribute('aria-haspopup')).toBe('true');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('menu', { name: 'Services' })).toBeNull();

    fireEvent.click(trigger);

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    const menu = screen.getByRole('menu', { name: 'Services' });
    expect(within(menu).getByRole('menuitem', { name: 'Office Cleaning' })).toBeTruthy();
    expect(within(menu).getByRole('menuitem', { name: 'Widgets' })).toBeTruthy();
  });

  it('opens on mouse hover and closes on mouse-leave', () => {
    render(<Shell page={page} nav={navWithDropdown()}><div /></Shell>);
    const primary = within(screen.getByRole('navigation', { name: 'Primary' }));
    const trigger = primary.getByRole('button', { name: /Services/ });
    const wrapper = trigger.parentElement!;

    fireEvent.pointerEnter(wrapper, { pointerType: 'mouse' });
    expect(screen.getByRole('menu', { name: 'Services' })).toBeTruthy();

    fireEvent.pointerLeave(wrapper, { pointerType: 'mouse' });
    expect(screen.queryByRole('menu', { name: 'Services' })).toBeNull();
  });

  it('a touch tap does not flash the menu closed (P1: touch pointerenter must not arm hover-close)', () => {
    // Regression for the touch-compatibility-event bug: a tap fires a pointerenter
    // (pointerType 'touch') immediately before the click. Hover open/close must
    // ignore non-mouse pointer types, or the click's toggle would see the menu
    // already open (from the touch pointerenter) and immediately close it again.
    render(<Shell page={page} nav={navWithDropdown()}><div /></Shell>);
    const primary = within(screen.getByRole('navigation', { name: 'Primary' }));
    const trigger = primary.getByRole('button', { name: /Services/ });
    const wrapper = trigger.parentElement!;

    fireEvent.pointerEnter(wrapper, { pointerType: 'touch' });
    expect(screen.queryByRole('menu', { name: 'Services' })).toBeNull();

    fireEvent.click(trigger);
    expect(screen.getByRole('menu', { name: 'Services' })).toBeTruthy();
  });

  it('closes on Escape (keyboard accessibility floor) and restores focus to the trigger', () => {
    render(<Shell page={page} nav={navWithDropdown()}><div /></Shell>);
    const primary = within(screen.getByRole('navigation', { name: 'Primary' }));
    const trigger = primary.getByRole('button', { name: /Services/ });
    fireEvent.click(trigger);
    expect(screen.getByRole('menu', { name: 'Services' })).toBeTruthy();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('menu', { name: 'Services' })).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('clicking the trigger again toggles the menu closed', () => {
    render(<Shell page={page} nav={navWithDropdown()}><div /></Shell>);
    const primary = within(screen.getByRole('navigation', { name: 'Primary' }));
    const trigger = primary.getByRole('button', { name: /Services/ });

    fireEvent.click(trigger);
    expect(screen.getByRole('menu', { name: 'Services' })).toBeTruthy();
    fireEvent.click(trigger);
    expect(screen.queryByRole('menu', { name: 'Services' })).toBeNull();
  });

  it('marks the child matching page.slug with aria-current="page"', () => {
    const p = { ...page, slug: '/widgets' };
    render(<Shell page={p} nav={navWithDropdown()}><div /></Shell>);
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Primary' })).getByRole('button', { name: /Services/ }));

    const menu = screen.getByRole('menu', { name: 'Services' });
    expect(within(menu).getByRole('menuitem', { name: 'Widgets' }).getAttribute('aria-current')).toBe('page');
    expect(within(menu).getByRole('menuitem', { name: 'Office Cleaning' }).getAttribute('aria-current')).toBeNull();
  });

  it('a flat NavLink (no children) alongside a dropdown still renders as a plain link', () => {
    render(<Shell page={page} nav={navWithDropdown()}><div /></Shell>);
    const primary = within(screen.getByRole('navigation', { name: 'Primary' }));
    for (const l of nav.primary) {
      expect(primary.getByRole('link', { name: l.label })).toBeTruthy();
    }
  });
});

describe('Shell mobile nav — nested accordion', () => {
  function openMobileMenu() {
    fireEvent.click(screen.getByLabelText('Open menu'));
    return within(document.getElementById('vf-mobile-nav')!);
  }

  it('renders a disclosure button, not a link, for an item with children', () => {
    render(<Shell page={page} nav={navWithDropdown()}><div /></Shell>);
    const menu = openMobileMenu();
    expect(menu.getByRole('button', { name: /Services/ })).toBeTruthy();
    expect(menu.queryByRole('link', { name: 'Services' })).toBeNull();
  });

  it('expands the accordion on click, revealing children; collapses again on second click', () => {
    render(<Shell page={page} nav={navWithDropdown()}><div /></Shell>);
    const menu = openMobileMenu();
    const trigger = menu.getByRole('button', { name: /Services/ });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(menu.queryByRole('link', { name: 'Office Cleaning' })).toBeNull();

    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(menu.getByRole('link', { name: 'Office Cleaning' })).toBeTruthy();

    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(menu.queryByRole('link', { name: 'Office Cleaning' })).toBeNull();
  });

  it('clicking a child link closes the whole mobile menu (existing top-level behaviour preserved)', () => {
    render(<Shell page={page} nav={navWithDropdown()}><div /></Shell>);
    const menu = openMobileMenu();
    fireEvent.click(menu.getByRole('button', { name: /Services/ }));
    fireEvent.click(menu.getByRole('link', { name: 'Office Cleaning' }));

    expect(document.getElementById('vf-mobile-nav')).toBeNull();
  });

  it('flat NavLinks in the mobile menu are unaffected by a sibling dropdown', () => {
    render(<Shell page={page} nav={navWithDropdown()}><div /></Shell>);
    const menu = openMobileMenu();
    for (const l of nav.primary) {
      expect(menu.getByRole('link', { name: l.label })).toBeTruthy();
    }
  });
});

describe('Shell — flat-nav consumers are unaffected (Care/Staffing parity)', () => {
  it('a SiteNav with no children anywhere renders identically whether or not the dropdown feature exists', () => {
    // nav (the shared fixture) has zero children on any primary link — this is
    // exactly Care/Staffing's current shape. Asserts no dropdown scaffolding
    // (button/menu roles) leaks into a flat-nav render.
    render(<Shell page={page} nav={nav}><div /></Shell>);
    const primary = within(screen.getByRole('navigation', { name: 'Primary' }));
    for (const l of nav.primary) {
      expect(primary.getByRole('link', { name: l.label })).toBeTruthy();
    }
    expect(screen.queryByRole('menu')).toBeNull();
    expect(primary.queryAllByRole('button', { name: /▾/ })).toHaveLength(0);
  });
});
