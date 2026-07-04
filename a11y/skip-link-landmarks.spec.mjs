import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * §14 Journey 1 — Skip link, landmarks, heading order, Axe-clean (homepage, desktop).
 * WCAG 2.4.1 (Bypass Blocks), 1.3.1 (Info & Relationships), 2.4.6 (Headings/Labels), 1.4.3.
 * Axe runs after `networkidle` so styles/fonts are settled (a pre-hydration read produced
 * transient default-link-colour false positives).
 */
test.describe('@a11y homepage — skip link + landmarks', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('first Tab reveals a working skip link that moves focus to <main>', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: /skip to content/i });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible(); // sr-only -> visible on focus
    await expect(skip).toHaveAttribute('href', '#main-content');
    await skip.press('Enter');
    await expect(page.locator('main#main-content')).toBeVisible();
  });

  test('has exactly one banner, one main, one contentinfo landmark and a single h1', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.locator('header')).toHaveCount(1);
    await expect(page.locator('main#main-content')).toHaveCount(1);
    await expect(page.locator('footer')).toHaveCount(1);
    await expect(page.getByRole('navigation', { name: /primary/i })).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
  });

  test('no serious/critical Axe violations on the homepage', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    // Full gate — the footer target-size finding (J-FW1) was fixed at source in framework v0.4.4,
    // so there is no longer any excluded category. Any serious/critical violation fails.
    expect(serious, JSON.stringify(serious.map((v) => ({ id: v.id, nodes: v.nodes.length })), null, 2)).toEqual([]);
  });
});
