import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { LOCATION_PATH, ARTICLE_PATH } from './_routes.mjs';

/**
 * §14 Journey 10 — landmarks + heading order + Axe-clean on a location page AND an article (desktop).
 * WCAG 2.4.1 (Bypass Blocks), 1.3.1 (Info & Relationships), 2.4.6 (Headings/Labels),
 * 1.3.2 (Meaningful Sequence), 1.4.3 (Contrast), 4.1.2 (Name/Role/Value).
 *
 * J1 proves the semantic contract on the HOMEPAGE. Interior pages are a distinct render
 * path (dynamic `[[...slug]]` content pages) whose sections are assembled from JSON, so the
 * landmark/heading/Axe contract must be re-proven there. This journey drives TWO interior
 * page types the Shell wraps differently in practice:
 *   • a LOCATION page  — `A11Y_LOCATION_PATH` (page_type=borough)
 *   • an ARTICLE       — `A11Y_ARTICLE_PATH`  (page_type=blog)
 * both division-supplied, and for each asserts: one banner/main/contentinfo landmark +
 * single h1; a non-skipping heading outline (no level jumps by >1); and zero
 * serious/critical Axe violations.
 * `networkidle` so fonts/styles/hydration have settled before Axe reads computed styles.
 */
const PAGES = [
  { label: 'location page (borough)', path: LOCATION_PATH },
  { label: 'article (blog)', path: ARTICLE_PATH },
];

test.describe('@a11y interior pages — landmarks + heading order + Axe', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  for (const { label, path } of PAGES) {
    test(`${label}: one banner/main/contentinfo landmark + a single h1`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'networkidle' });
      // Sanity: really rendered this interior page, not a 404/redirect to home.
      await expect(page).toHaveURL(new RegExp(`${path}/?$`));

      await expect(page.locator('header')).toHaveCount(1);
      await expect(page.locator('main#main-content')).toHaveCount(1);
      await expect(page.locator('footer')).toHaveCount(1);
      await expect(page.getByRole('navigation', { name: /primary/i })).toBeVisible();
      await expect(page.locator('h1')).toHaveCount(1);
    });

    test(`${label}: heading outline does not skip a level`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'networkidle' });

      const levels = await page.evaluate(() =>
        Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map((h) =>
          Number(h.tagName.substring(1)),
        ),
      );
      expect(levels.length, 'page has at least one heading').toBeGreaterThan(0);
      expect(levels[0], 'first heading is the h1').toBe(1);
      // No jump DOWN the outline by more than one level (e.g. h2 -> h4 is a violation).
      for (let i = 1; i < levels.length; i++) {
        const jump = levels[i] - levels[i - 1];
        expect(jump, `heading level jump at index ${i}: ${JSON.stringify(levels)}`).toBeLessThanOrEqual(1);
      }
    });

    test(`${label}: no serious/critical Axe violations`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'networkidle' });
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      const serious = results.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      );
      // Full gate — no excluded category (the footer target-size finding was fixed at source
      // in framework v0.4.4). Any serious/critical violation fails.
      expect(
        serious,
        JSON.stringify(serious.map((v) => ({ id: v.id, nodes: v.nodes.length })), null, 2),
      ).toEqual([]);
    });
  }
});
