import { test, expect } from '@playwright/test';
import { SERVICE_PATH } from './_routes.mjs';

/**
 * §14 Journey 8 — Reduced motion honored (WCAG 2.2 SC 2.3.3 Animation from
 * Interactions; supports SC 2.2.2 Pause, Stop, Hide).
 *
 * A user who has set an OS "reduce motion" preference must not be subjected to
 * involuntary, continuously-playing or large-scale motion, and no content or
 * functionality may be gated behind that motion. We emulate the preference at the
 * browser level (`prefers-reduced-motion: reduce`) and assert, on both the homepage
 * (full Shell) and an interior service page (the dynamic `[[...slug]]` render path —
 * distinct code path, so honoring must be proven there too):
 *   0. the emulation is genuinely active — `matchMedia('(prefers-reduced-motion:
 *      reduce)')` matches — so the assertions below are NOT a vacuous pass;
 *   1. NO involuntary motion is imposed — no visible element is running a CSS keyframe
 *      animation (the vestibular-trigger class the preference primarily targets), and
 *      neither <html> nor <body> hijacks scrolling with `scroll-behavior: smooth`;
 *   2. functionality parity — the page renders fully under the reduced-motion
 *      preference: the skip link is the first Tab stop and reaches <main>, there is a
 *      single page H1, and a navigation affordance stays visible and operable. No
 *      content is hidden behind an animation that reduced motion would suppress.
 * `networkidle` so fonts/styles/hydration have settled before we measure.
 */
test.describe('@a11y reduced motion honored (prefers-reduced-motion: reduce)', () => {
  // Fixed desktop viewport (the full Shell, all primary nav visible ≥ md). The
  // reduced-motion preference is emulated per test via page.emulateMedia() below —
  // the explicit, reliable API that flips matchMedia in the page.
  test.use({ viewport: { width: 1280, height: 800 } });

  const PAGES = ['/', SERVICE_PATH];

  for (const path of PAGES) {
    test(`${path} — the reduced-motion preference is actually active`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(path, { waitUntil: 'networkidle' });
      // Guard: prove the media query resolves to reduce, otherwise everything below
      // would pass for the wrong reason (motion simply not being emulated).
      const reduces = await page.evaluate(
        () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      );
      expect(reduces).toBe(true);
    });

    test(`${path} — no involuntary motion: no running keyframe animation, no smooth-scroll hijack`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(path, { waitUntil: 'networkidle' });

      // (a) No visible element is actively running a CSS keyframe animation. A running
      //     animation = a resolved animation-name (not 'none'), a non-zero duration,
      //     and play-state 'running'. This is the continuous / auto-playing motion that
      //     prefers-reduced-motion exists to suppress; the site must impose none.
      const animating = await page.evaluate(() => {
        const bad = [];
        for (const el of Array.from(document.body.querySelectorAll('*'))) {
          const s = getComputedStyle(el);
          if (s.display === 'none' || s.visibility === 'hidden') continue;
          const names = s.animationName;
          if (!names || names === 'none') continue;
          const durs = s.animationDuration.split(',').map((d) => parseFloat(d) || 0);
          const running = s.animationPlayState.split(',').some((p) => p.trim() === 'running');
          if (running && durs.some((d) => d > 0)) {
            const id = el.id ? `#${el.id}` : '';
            bad.push(`${el.tagName.toLowerCase()}${id} animation=${names} dur=${s.animationDuration}`);
          }
        }
        return bad;
      });
      expect(animating, animating.join('\n')).toEqual([]);

      // (b) No scroll-behavior hijack — a smooth-scroll on the root/body is large-scale
      //     motion the preference should turn off. Default 'auto' (instant) is correct.
      const scroll = await page.evaluate(() => ({
        html: getComputedStyle(document.documentElement).scrollBehavior,
        body: getComputedStyle(document.body).scrollBehavior,
      }));
      expect(scroll.html, JSON.stringify(scroll)).not.toBe('smooth');
      expect(scroll.body, JSON.stringify(scroll)).not.toBe('smooth');
    });

    test(`${path} — content + navigation fully usable under reduced motion`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(path, { waitUntil: 'networkidle' });

      // Skip link is the first Tab stop and moves focus to <main> — bypass-blocks works
      // regardless of the motion preference; no content gated behind an animation.
      await page.keyboard.press('Tab');
      const skip = page.getByRole('link', { name: /skip to content/i });
      await expect(skip).toBeFocused();
      await skip.press('Enter');
      await expect(page.locator('main#main-content')).toBeVisible();

      // Exactly one page H1 and an operable navigation affordance. At 1280 (≥ md) the
      // primary nav is visible; assert it and the phone link render without any motion.
      await expect(page.locator('h1')).toHaveCount(1);
      const nav = page.getByRole('navigation', { name: /primary/i });
      await expect(nav).toBeVisible();
      await expect(nav.locator('a[href^="tel:"]')).toHaveCount(1);
    });
  }
});
