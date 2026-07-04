import { test, expect } from '@playwright/test';

/**
 * §14 Journey 3 — Mobile menu keyboard + focus management (mobile viewport).
 * WCAG 2.1.1 (Keyboard), 2.1.2 (No Keyboard Trap), 2.4.3 (Focus Order),
 * 1.3.1 (Info & Relationships — dialog role/modal), 4.1.2 (Name, Role, Value).
 *
 * The framework Shell renders a `<button aria-label="Open menu" aria-expanded
 * aria-controls="vf-mobile-nav">☰</button>` (visible < md). Activating it opens
 * `<div id="vf-mobile-nav" role="dialog" aria-modal="true" aria-label="Menu">`
 * with a `<button aria-label="Close menu">`. Behaviour is implemented in Shell:
 * opening moves focus to the close button, ESC closes, and on close focus
 * returns to the toggle (body scroll is locked while open). This journey proves
 * that keyboard contract end-to-end on the Pixel 5 (mobile) project.
 * `networkidle` so hydration has run before we drive the keyboard.
 */
test.describe('@a11y mobile menu — keyboard open + focus management', () => {
  // Pin a mobile-width viewport so the md:hidden ☰ toggle is present on EVERY project
  // (this journey is viewport-, not project-, dependent).
  test.use({ viewport: { width: 390, height: 844 } });

  test('Enter on ☰ opens the dialog and moves focus to the close button', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const toggle = page.getByRole('button', { name: /open menu/i });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toHaveAttribute('aria-controls', 'vf-mobile-nav');

    // Open via keyboard (not a click) — WCAG 2.1.1.
    await toggle.focus();
    await expect(toggle).toBeFocused();
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('dialog', { name: /menu/i });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toHaveAttribute('id', 'vf-mobile-nav');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    // Focus is moved INTO the dialog, onto the close button.
    const close = page.getByRole('button', { name: /close menu/i });
    await expect(close).toBeFocused();
    // Sanity: the moved focus is genuinely inside the dialog subtree.
    const focusInsideDialog = await page.evaluate(() => {
      const d = document.getElementById('vf-mobile-nav');
      return !!(d && document.activeElement && d.contains(document.activeElement));
    });
    expect(focusInsideDialog).toBe(true);
  });

  test('ESC closes the dialog and restores focus to the toggle', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const toggle = page.getByRole('button', { name: /open menu/i });
    await toggle.focus();
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('dialog', { name: /menu/i });
    await expect(dialog).toBeVisible();

    // ESC (fielded on window) must close the dialog...
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    // ...and return focus to the toggle that opened it (WCAG 2.4.3 focus order).
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('the mobile dialog contains a labelled Mobile nav — no keyboard trap material', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const toggle = page.getByRole('button', { name: /open menu/i });
    await toggle.focus();
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('dialog', { name: /menu/i });
    await expect(dialog).toBeVisible();
    // The dialog exposes a labelled Mobile nav with reachable links + the close control.
    await expect(dialog.getByRole('navigation', { name: /mobile/i })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /close menu/i })).toBeVisible();
    expect(await dialog.locator('a').count()).toBeGreaterThanOrEqual(1);

    // Activating Close (keyboard) also closes and restores focus — the second exit path.
    const close = page.getByRole('button', { name: /close menu/i });
    await close.focus();
    await page.keyboard.press('Enter');
    await expect(dialog).toHaveCount(0);
    await expect(toggle).toBeFocused();
  });
});
