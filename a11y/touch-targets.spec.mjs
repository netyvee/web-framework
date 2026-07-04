import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * §14 Journey 9 — WCAG 2.2 §2.5.8 Target Size (Minimum, AA), mobile.
 * After framework v0.4.4 the footer contact links carry a ≥24px tap box and the
 * ☰ toggle is 44×44. This journey proves target-size is now clean at source.
 */
test.describe('@a11y target size — nav + footer contact links (mobile)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('zero target-size / target-offset Axe violations on the homepage', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const results = await new AxeBuilder({ page })
      .withRules(['target-size'])
      .analyze();
    const hits = results.violations.filter((v) => v.id === 'target-size' || v.id === 'target-offset');
    expect(hits, JSON.stringify(hits.map((v) => ({ id: v.id, n: v.nodes.length })), null, 2)).toEqual([]);
  });

  test('the ☰ toggle is at least 24×24 CSS px', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const box = await page.getByRole('button', { name: /open menu/i }).boundingBox();
    expect(box).not.toBeNull();
    expect(box.width).toBeGreaterThanOrEqual(24);
    expect(box.height).toBeGreaterThanOrEqual(24);
  });

  test('footer phone + email links are at least 24px tall', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const footer = page.locator('footer');
    for (const link of [footer.locator('a[href^="tel:"]').first(), footer.locator('a[href^="mailto:"]').first()]) {
      if (await link.count()) {
        const box = await link.boundingBox();
        expect(box.height).toBeGreaterThanOrEqual(24);
      }
    }
  });
});
