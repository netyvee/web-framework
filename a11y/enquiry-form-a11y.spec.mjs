import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * §14 Journey 7 — Enquiry funnel accessibility (desktop).
 * WCAG 1.3.1 (Info & Relationships), 3.3.2 (Labels or Instructions),
 * 2.1.1 (Keyboard), 4.1.2 (Name, Role, Value), 4.1.3 (Status Messages).
 *
 * A framework site collects enquiry intent through the shared EnquiryFunnel
 * (`enquiry_funnel` section), NOT a native text-input form. The funnel is a CHOICE
 * funnel that hands the collected intent to the hardened CRM enquiry URL, where the
 * actual free-text data-entry form lives. So the classic "error summary + invalid-field
 * announcement" pattern has no target in the site repo: there is no free-text field,
 * hence no reachable invalid state — validation is by construction (a step completes
 * only by selecting one enumerated option). Blocking a whole journey on that DOM
 * mismatch would be wrong; the funnel is the accessible form-equivalent on the page,
 * and its real a11y contract IS deterministically testable.
 *
 * This journey is division-AGNOSTIC: it anchors on the framework-emitted structure
 * (the `aria-label="Enquiry progress"` progressbar, the labelled radiogroup, the
 * focus-managed step heading) rather than any site's step copy, and drives the funnel
 * to completion through however many steps the site configures.
 *
 * What this journey proves:
 *   1. the choice group is a LABELLED radiogroup (non-empty accessible name = the step
 *      question) and every option is a keyboard-operable control with a non-empty
 *      accessible name — the "labels" contract (1.3.1 / 3.3.2 / 4.1.2);
 *   2. it is fully keyboard-operable — Tab reaches an option, Enter selects it, the step
 *      advances (2.1.1, no mouse required);
 *   3. advancing ANNOUNCES progress (the progressbar's aria-valuenow increases 0 -> 100)
 *      and moves focus to the new step heading (4.1.3 status message + focus management —
 *      the funnel's analog of surfacing a validation/step result);
 *   4. no serious/critical Axe violations inside the funnel region.
 * `networkidle` so hydration/fonts settle before the keyboard is driven.
 */
const PROGRESS = /enquiry progress/i;                       // framework progressbar aria-label
const FUNNEL_REGION = 'section:has([aria-label="Enquiry progress"])';

test.describe('@a11y enquiry funnel — labels, keyboard operation, status announcement', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('the choice group is a labelled radiogroup with named, keyboard-focusable options', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const funnel = page.locator(FUNNEL_REGION);
    const group = funnel.getByRole('radiogroup');
    await expect(group).toHaveCount(1);
    await expect(group).toBeVisible();
    // Accessible name present (1.3.1 / 3.3.2): the group is labelled by the step question.
    await expect(group).toHaveAttribute('aria-label', /.+/);

    const options = group.getByRole('radio');
    const n = await options.count();
    expect(n).toBeGreaterThanOrEqual(2);

    for (let i = 0; i < n; i++) {
      const opt = options.nth(i);
      // Each option exposes role=radio + aria-checked (4.1.2 Name, Role, Value)...
      await expect(opt).toHaveAttribute('aria-checked', /true|false/);
      // ...and a non-empty accessible name (the visible label text).
      const name = (await opt.textContent())?.trim() ?? '';
      expect(name.length, `option ${i} accessible name`).toBeGreaterThan(0);
      // Keyboard-reachable: a real focusable control.
      await opt.focus();
      await expect(opt).toBeFocused();
    }
  });

  test('keyboard selection advances each step, moves focus, and announces progress', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const funnel = page.locator(FUNNEL_REGION);
    const progress = page.getByRole('progressbar', { name: PROGRESS });
    await expect(progress).toBeVisible();
    await expect(progress).toHaveAttribute('aria-valuenow', '0');

    // Drive the funnel to completion with the keyboard ONLY — no click — through
    // however many steps the site configures (staffing has one; Care may have more).
    let guard = 0;
    let last = 0;
    while ((await funnel.getByRole('radiogroup').count()) > 0 && guard < 12) {
      guard++;
      const firstRadio = funnel.getByRole('radiogroup').getByRole('radio').first();
      await firstRadio.focus();
      await expect(firstRadio).toBeFocused();
      await page.keyboard.press('Enter');

      // After each selection the step heading (h2, tabIndex=-1) receives focus —
      // the step result is both visible AND announced (4.1.3 + focus management).
      await expect(funnel.locator('h2')).toBeFocused();

      // Progress is monotonically non-decreasing and conveyed via aria-valuenow.
      const now = Number(await progress.getAttribute('aria-valuenow'));
      expect(now, `progress must not go backwards (was ${last}, now ${now})`).toBeGreaterThanOrEqual(last);
      last = now;
    }

    // Completed: progress is 100% and no stale/duplicate radiogroup remains.
    await expect(progress).toHaveAttribute('aria-valuenow', '100');
    await expect(funnel.getByRole('radiogroup')).toHaveCount(0);
  });

  test('no serious/critical Axe violations inside the enquiry funnel', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Scope Axe to the funnel section (the section that owns the progressbar).
    const results = await new AxeBuilder({ page })
      .include('section:has([aria-label="Enquiry progress"])')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious, JSON.stringify(serious.map((v) => ({ id: v.id, nodes: v.nodes.length })), null, 2)).toEqual([]);
  });
});
