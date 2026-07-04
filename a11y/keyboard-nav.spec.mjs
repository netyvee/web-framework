import { test, expect } from '@playwright/test';

/**
 * §14 Journey 2 — Keyboard-only primary navigation (homepage, desktop).
 * WCAG 2.1.1 (Keyboard), 2.1.2 (No Keyboard Trap), 2.4.3 (Focus Order),
 * 2.4.7 (Focus Visible).
 *
 * The framework Shell renders the desktop nav as `<nav aria-label="Primary">`
 * (hidden < md) containing, in DOM order: the primary links, the phone
 * `a[href^="tel:"]`, then the CTA link. The brand link sits immediately before
 * the nav. This journey drives Tab from the brand link and proves every nav
 * target is reachable in order, shows a visible focus indicator, and does not
 * trap the keyboard. `networkidle` so fonts/styles have settled first.
 */
test.describe('@a11y homepage — keyboard-only primary nav', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('Tab reaches every primary link + phone + CTA in DOM order', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const nav = page.getByRole('navigation', { name: /primary/i });
    await expect(nav).toBeVisible();
    const anchors = nav.locator('a');
    const count = await anchors.count();
    // sanity: primary links + phone + CTA => at least 3 focusable targets
    expect(count).toBeGreaterThanOrEqual(3);

    // The phone (tel:) and CTA (enquiry funnel) must both live inside the nav.
    await expect(nav.locator('a[href^="tel:"]')).toHaveCount(1);

    // Start on the brand link (the element immediately before the nav), then
    // Tab once per nav anchor and assert focus lands on each, in order.
    const brand = page.locator('header a').first();
    await brand.focus();
    await expect(brand).toBeFocused();

    for (let i = 0; i < count; i++) {
      await page.keyboard.press('Tab');
      await expect(anchors.nth(i)).toBeFocused();
    }
  });

  test('a focused nav link exposes a visible focus indicator', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const brand = page.locator('header a').first();
    await brand.focus();
    await page.keyboard.press('Tab'); // -> first primary nav anchor

    const indicator = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      const s = getComputedStyle(el);
      const outlineW = parseFloat(s.outlineWidth) || 0;
      return {
        outlineStyle: s.outlineStyle,
        outlineWidth: outlineW,
        boxShadow: s.boxShadow,
      };
    });
    expect(indicator).not.toBeNull();
    // A visible indicator = a rendered outline (UA ring reports style 'auto', or a
    // themed outline with width > 0) OR a focus box-shadow. Any one is sufficient.
    const hasIndicator =
      indicator.outlineStyle === 'auto' ||
      (indicator.outlineStyle !== 'none' && indicator.outlineWidth > 0) ||
      (indicator.boxShadow !== 'none' && indicator.boxShadow !== '');
    expect(hasIndicator, JSON.stringify(indicator)).toBe(true);
  });

  test('no keyboard trap — Tab past the last nav item leaves the primary nav', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const nav = page.getByRole('navigation', { name: /primary/i });
    const count = await nav.locator('a').count();

    const brand = page.locator('header a').first();
    await brand.focus();
    // Tab through every nav anchor...
    for (let i = 0; i < count; i++) await page.keyboard.press('Tab');
    // ...one more Tab must move focus OUT of the primary nav (no trap).
    await page.keyboard.press('Tab');
    const stillInNav = await page.evaluate(() => {
      const n = document.querySelector('nav[aria-label="Primary"]');
      return !!(n && document.activeElement && n.contains(document.activeElement));
    });
    expect(stillInNav).toBe(false);
  });
});
