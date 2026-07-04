import { test, expect } from '@playwright/test';
import { SERVICE_PATH } from './_routes.mjs';

/**
 * §14 Journey 5 — 320px reflow (WCAG 2.2 SC 1.4.10, Reflow).
 *
 * At 320 CSS px wide, content must reflow to a single column with NO loss of
 * information or functionality and — critically — WITHOUT requiring scrolling in
 * two dimensions. In practice: no horizontal scrollbar, and no individual element
 * overflowing the viewport width. This journey pins a 320px-wide viewport (the SC
 * 1.4.10 reference width) on the mobile project and asserts:
 *   1. the document does not scroll horizontally (scrollWidth ≈ clientWidth);
 *   2. no visible element extends past the right edge of the 320px viewport;
 *   3. the primary content + the mobile menu toggle remain reachable (functionality
 *      is preserved, not clipped away).
 * Both the homepage and an interior content page (`A11Y_SERVICE_PATH`, division-
 * supplied) are checked (distinct render paths).
 * `networkidle` so fonts/styles/hydration have settled before we measure layout.
 */
test.describe('@a11y 320px reflow — no horizontal scroll', () => {
  // SC 1.4.10 reference width. Pin it explicitly so the journey is viewport-driven,
  // not dependent on the mobile device's default width (Pixel 5 is 393px).
  test.use({ viewport: { width: 320, height: 844 } });

  const PAGES = ['/', SERVICE_PATH];

  for (const path of PAGES) {
    test(`${path} — document does not scroll horizontally at 320px`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'networkidle' });

      // The scrollable content width must not exceed the viewport width. A 1px
      // rounding allowance keeps sub-pixel layout from producing false failures.
      const metrics = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        innerWidth: window.innerWidth,
      }));
      expect(metrics.clientWidth).toBeLessThanOrEqual(321);
      expect(
        metrics.scrollWidth,
        JSON.stringify(metrics),
      ).toBeLessThanOrEqual(metrics.clientWidth + 1);
    });

    test(`${path} — no visible element overflows the 320px viewport`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'networkidle' });

      // Walk every rendered element; flag any whose painted box extends meaningfully
      // (>1px) past the right edge of the viewport. Excluded (NOT reflow violations
      // under SC 1.4.10):
      //   - elements intentionally parked fully off-canvas (closed off-canvas menu);
      //   - elements contained by an ancestor that clips or scrolls horizontally
      //     (overflow-x: hidden|auto|scroll|clip) — a self-contained horizontally
      //     scrollable region (carousel / logo ticker / data table) is permitted;
      //     the document itself not scrolling in two dimensions is asserted above.
      const overflowers = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const clippedByAncestor = (el) => {
          let p = el.parentElement;
          while (p && p !== document.documentElement) {
            const ox = getComputedStyle(p).overflowX;
            if (ox === 'hidden' || ox === 'auto' || ox === 'scroll' || ox === 'clip') return true;
            p = p.parentElement;
          }
          return false;
        };
        const bad = [];
        for (const el of Array.from(document.body.querySelectorAll('*'))) {
          const s = getComputedStyle(el);
          if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') continue;
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          // Ignore elements intentionally parked off-canvas (fully outside the viewport).
          if (r.left >= vw || r.right <= 0) continue;
          if (clippedByAncestor(el)) continue;
          if (r.right > vw + 1) {
            const id = el.id ? `#${el.id}` : '';
            const cls = typeof el.className === 'string' && el.className
              ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}`
              : '';
            bad.push(`${el.tagName.toLowerCase()}${id}${cls} right=${Math.round(r.right)} vw=${vw}`);
          }
        }
        return bad;
      });
      expect(overflowers, overflowers.join('\n')).toEqual([]);
    });
  }

  test('/ — primary content + mobile toggle stay reachable at 320px', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    // Functionality preserved: main content renders and the mobile menu control is
    // present and operable at the reflow width (not clipped or hidden away).
    await expect(page.locator('main#main-content')).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.getByRole('button', { name: /open menu/i })).toBeVisible();
  });
});
