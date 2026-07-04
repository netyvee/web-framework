import { test, expect } from '@playwright/test';
import { SERVICE_PATH } from './_routes.mjs';

/**
 * §14 Journey 4 — Focus order + visible focus across an interior service page (desktop).
 * WCAG 2.1.1 (Keyboard), 2.1.2 (No Keyboard Trap), 2.4.1 (Bypass Blocks),
 * 2.4.3 (Focus Order), 2.4.7 (Focus Visible).
 *
 * J1/J2 prove the skip link, landmarks and keyboard nav on the HOMEPAGE. The Shell
 * is shared, but interior pages are a distinct render path (dynamic `[[...slug]]`
 * content pages) so the sequential focus contract must be proven there too. This
 * journey drives an interior service page (`A11Y_SERVICE_PATH`, division-supplied)
 * and asserts:
 *   1. the skip link is the first Tab stop and moves focus to <main>;
 *   2. from the brand link, Tab reaches every primary nav anchor + phone + CTA in
 *      DOM order;
 *   3. a focused nav link exposes a visible focus indicator;
 *   4. focus is not trapped in the header — tabbing past the nav enters the page body.
 * `networkidle` so fonts/styles/hydration have settled before we drive the keyboard.
 */
test.describe('@a11y interior service page — focus order + visible focus', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  const PAGE = SERVICE_PATH;

  test('first Tab reveals the skip link and moves focus to <main>', async ({ page }) => {
    await page.goto(PAGE, { waitUntil: 'networkidle' });
    // Sanity: this really is the interior service page, not a redirect to home.
    await expect(page).toHaveURL(new RegExp(`${PAGE}/?$`));

    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: /skip to content/i });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible(); // sr-only -> visible on focus
    await expect(skip).toHaveAttribute('href', '#main-content');
    await skip.press('Enter');
    await expect(page.locator('main#main-content')).toBeVisible();
  });

  test('Tab reaches every primary nav link + phone + CTA in DOM order', async ({ page }) => {
    await page.goto(PAGE, { waitUntil: 'networkidle' });

    const nav = page.getByRole('navigation', { name: /primary/i });
    await expect(nav).toBeVisible();
    const anchors = nav.locator('a');
    const count = await anchors.count();
    // primary links + phone + CTA => at least 3 focusable targets
    expect(count).toBeGreaterThanOrEqual(3);
    // The phone (tel:) must live inside the nav.
    await expect(nav.locator('a[href^="tel:"]')).toHaveCount(1);

    // Start on the brand link (immediately before the nav), then Tab once per nav
    // anchor and assert focus lands on each, in order.
    const brand = page.locator('header a').first();
    await brand.focus();
    await expect(brand).toBeFocused();

    for (let i = 0; i < count; i++) {
      await page.keyboard.press('Tab');
      await expect(anchors.nth(i)).toBeFocused();
    }
  });

  test('a focused nav link exposes a visible focus indicator', async ({ page }) => {
    await page.goto(PAGE, { waitUntil: 'networkidle' });

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

  test('no keyboard trap — tabbing past the header nav enters the page body', async ({ page }) => {
    await page.goto(PAGE, { waitUntil: 'networkidle' });

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
    // And focus has genuinely landed on a focusable element somewhere on the page
    // (the body content is reachable by keyboard), not fallen back to <body>.
    const advanced = await page.evaluate(() => {
      const el = document.activeElement;
      return !!(el && el !== document.body && el.tagName !== 'HTML');
    });
    expect(advanced).toBe(true);
  });
});
