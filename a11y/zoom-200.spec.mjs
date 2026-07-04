import { test, expect } from '@playwright/test';
import { SERVICE_PATH } from './_routes.mjs';

/**
 * §14 Journey 6 — 200% zoom (WCAG 2.2 SC 1.4.4 Resize Text + SC 1.4.10 Reflow).
 *
 * A sighted low-vision user zooms the browser to 200%. On a 1280 CSS-px desktop
 * window that halves the usable layout to 640 CSS px (1280 → 640): all content and
 * functionality must remain available with NO loss of information — specifically no
 * two-dimensional (horizontal) scrolling and no text clipped away inside a
 * fixed-size box. We simulate the magnified layout deterministically by pinning the
 * post-zoom CSS viewport width (640) on the desktop project — the exact "1280 → 640
 * css px" the backlog names — and assert, on both the homepage and an interior
 * service page (`A11Y_SERVICE_PATH`, division-supplied — the dynamic content route):
 *   1. the document does not scroll horizontally (scrollWidth ≈ clientWidth);
 *   2. no visible element overflows the 640px viewport horizontally;
 *   3. no text is clipped away — no text-bearing element with overflow hidden|clip
 *      has content that overflows its own box (content is resized, never cut off);
 *   4. functionality is preserved — main content + a single H1 render and a
 *      navigation affordance (the mobile toggle, since 640 < md) stays operable.
 * `networkidle` so fonts/styles/hydration have settled before we measure layout.
 */
test.describe('@a11y 200% zoom — content usable, nothing clipped (1280 → 640 css px)', () => {
  // 200% zoom of the 1280-px desktop window = 640 CSS px of layout width. Pin it on
  // the desktop project so the journey is zoom-driven, not device-default-driven.
  test.use({ viewport: { width: 640, height: 800 } });

  const PAGES = ['/', SERVICE_PATH];

  for (const path of PAGES) {
    test(`${path} — document does not scroll horizontally at 640px (200% zoom)`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'networkidle' });

      // The scrollable content width must not exceed the viewport width — reflow to a
      // single column, no 2-D scrolling. A 1px allowance absorbs sub-pixel rounding.
      const metrics = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        innerWidth: window.innerWidth,
      }));
      expect(metrics.clientWidth).toBeLessThanOrEqual(641);
      expect(
        metrics.scrollWidth,
        JSON.stringify(metrics),
      ).toBeLessThanOrEqual(metrics.clientWidth + 1);
    });

    test(`${path} — no visible element overflows the 640px viewport`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'networkidle' });

      // Walk every rendered element; flag any whose painted box extends meaningfully
      // (>1px) past the right edge. Excluded (NOT resize/reflow violations):
      //   - elements parked fully off-canvas (a closed off-canvas menu);
      //   - elements inside an ancestor that clips or scrolls horizontally
      //     (overflow-x hidden|auto|scroll|clip) — a self-contained horizontally
      //     scrollable region is permitted; the document not scrolling in two
      //     dimensions is asserted above.
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
          if (r.left >= vw || r.right <= 0) continue; // fully off-canvas
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

    test(`${path} — no text is clipped away at 200% zoom`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'networkidle' });

      // SC 1.4.4: resizing must not cut content off. A text-bearing element whose
      // overflow is hidden|clip while its own content overflows its box (scrollWidth
      // or scrollHeight meaningfully exceeds the client box) has clipped, unreachable
      // text. overflow auto|scroll is EXEMPT — that content is still reachable by
      // scrolling. Restrict to genuine text containers to avoid flagging positioning
      // wrappers whose overflow is decorative.
      const TEXT_TAGS = new Set([
        'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'A', 'BUTTON', 'SPAN',
        'LABEL', 'TD', 'TH', 'DT', 'DD', 'FIGCAPTION', 'BLOCKQUOTE', 'STRONG', 'EM',
      ]);
      const clipped = await page.evaluate((tagList) => {
        const tags = new Set(tagList);
        const TOL = 4; // px — ignore sub-pixel / rounding overflow
        const bad = [];
        for (const el of Array.from(document.body.querySelectorAll('*'))) {
          if (!tags.has(el.tagName)) continue;
          if (el.getAttribute('aria-hidden') === 'true') continue;
          const text = (el.textContent ?? '').trim();
          if (!text) continue;
          const s = getComputedStyle(el);
          if (s.display === 'none' || s.visibility === 'hidden') continue;
          // Skip the sr-only / visually-hidden idiom (a 1×1px clipped box that becomes
          // visible on focus): content is fully available to AT, NOT lost to resize.
          if (el.clientWidth <= 1 || el.clientHeight <= 1) continue;
          const oy = s.overflowY;
          const ox = s.overflowX;
          const clipsY = oy === 'hidden' || oy === 'clip';
          const clipsX = ox === 'hidden' || ox === 'clip';
          if (!clipsY && !clipsX) continue;
          const yOver = clipsY && el.scrollHeight - el.clientHeight > TOL;
          const xOver = clipsX && el.scrollWidth - el.clientWidth > TOL;
          if (yOver || xOver) {
            const id = el.id ? `#${el.id}` : '';
            bad.push(
              `${el.tagName.toLowerCase()}${id} ` +
              `scroll=${el.scrollWidth}x${el.scrollHeight} ` +
              `client=${el.clientWidth}x${el.clientHeight} "${text.slice(0, 40)}"`,
            );
          }
        }
        return bad;
      }, Array.from(TEXT_TAGS));
      expect(clipped, clipped.join('\n')).toEqual([]);
    });
  }

  test('/ — content + navigation stay usable at 200% zoom', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    // Functionality preserved after magnification: main content renders, exactly one
    // page H1, and a navigation affordance stays operable. Below md (640 < 768) the
    // desktop nav collapses to the mobile toggle — it must be visible and enabled.
    await expect(page.locator('main#main-content')).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    const toggle = page.getByRole('button', { name: /open menu/i });
    await expect(toggle).toBeVisible();
    await expect(toggle).toBeEnabled();
  });
});
