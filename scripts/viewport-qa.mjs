#!/usr/bin/env node
// viewport-qa.mjs — RENDERED multi-viewport visual QA (W-CARE-EXPERIENCE-CLOSURE).
// Drives a real headless Chromium at the operator viewport set (360/390/412/768/
// desktop), captures a full-page screenshot per viewport, and runs DETERMINISTIC
// rendered checks that static HTML cannot: horizontal overflow, sticky-CTA-vs-footer
// overlap (the "obscured footer" detector, live), and mobile-nav open/close +
// sticky-hidden-when-nav-open. Screenshots are the operator sign-off evidence.
//
// Usage: node viewport-qa.mjs --url <url> --out <dir> [--playwright <node_modules path>]
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const opt = (n, d = null) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const url = opt('--url');
const out = opt('--out', 'viewport-evidence');
const pwPath = opt('--playwright', 'C:/laragon/www/vigil-cleaning/node_modules/playwright');
if (!url) { console.error('usage: viewport-qa.mjs --url <url> --out <dir>'); process.exit(1); }

const require = createRequire(import.meta.url);
const { chromium } = require(pwPath);
fs.mkdirSync(out, { recursive: true });

const VIEWPORTS = [
  { name: 'mobile-360', w: 360, h: 800, mobile: true },
  { name: 'mobile-390', w: 390, h: 844, mobile: true },
  { name: 'mobile-412', w: 412, h: 915, mobile: true },
  { name: 'tablet-768', w: 768, h: 1024, mobile: true },
  { name: 'desktop-1280', w: 1280, h: 900, mobile: false },
];

const results = [];
const browser = await chromium.launch();

for (const v of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const checks = {};
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(400);

    // 1. horizontal overflow
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    checks.no_horizontal_overflow = { pass: overflow <= 2, detail: `scrollWidth-innerWidth=${overflow}px` };

    // full-page screenshot
    await page.screenshot({ path: path.join(out, `${v.name}.png`), fullPage: true });

    // 2. sticky-CTA vs footer overlap (mobile widths only — sticky is md:hidden on desktop)
    if (v.mobile && v.w < 768) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(300);
      const geo = await page.evaluate(() => {
        const sticky = document.querySelector('a[class*="fixed"][class*="bottom-0"]');
        const footer = document.querySelector('footer[data-vf-footer]') || document.querySelector('footer');
        const legal = footer ? Array.from(footer.querySelectorAll('*')).reverse().find((e) => /Company Reg|Reg\./i.test(e.textContent || '')) : null;
        const r = (el) => el ? el.getBoundingClientRect() : null;
        return { sticky: r(sticky), legal: r(legal), footer: r(footer) };
      });
      // the last footer/legal content must sit ABOVE the sticky top (not obscured)
      const ok = geo.sticky && geo.legal ? geo.legal.bottom <= geo.sticky.top + 2 : (geo.sticky ? true : false);
      checks.footer_not_obscured = { pass: ok, detail: geo.sticky && geo.legal ? `legal.bottom=${Math.round(geo.legal.bottom)} sticky.top=${Math.round(geo.sticky.top)}` : 'no sticky/legal at this width' };
      await page.evaluate(() => window.scrollTo(0, 0));

      // 3. mobile nav open → dialog visible + sticky hidden; close → reverse
      const hamburger = page.locator('button[aria-label="Open menu"]');
      await hamburger.click();
      await page.waitForTimeout(300);
      const opened = await page.evaluate(() => {
        const dlg = document.getElementById('vf-mobile-nav');
        // NB: offsetParent is null for position:fixed — use rect + computed display
        const visible = !!dlg && dlg.getBoundingClientRect().width > 0 && getComputedStyle(dlg).display !== 'none';
        const sticky = document.querySelector('a[class*="fixed"][class*="bottom-0"]');
        return { dialog: visible, stickyGone: !sticky };
      });
      checks.mobile_nav_opens_hides_sticky = { pass: opened.dialog && opened.stickyGone, detail: `dialog=${opened.dialog} stickyHidden=${opened.stickyGone}` };
      await page.locator('button[aria-label="Close menu"]').click();
      await page.waitForTimeout(300);
      const closed = await page.evaluate(() => ({ dialog: !!document.getElementById('vf-mobile-nav'), sticky: !!document.querySelector('a[class*="fixed"][class*="bottom-0"]') }));
      checks.mobile_nav_closes_restores_sticky = { pass: !closed.dialog && closed.sticky, detail: `dialogGone=${!closed.dialog} stickyBack=${closed.sticky}` };
    }
  } catch (e) {
    checks.load = { pass: false, detail: String(e).slice(0, 120) };
  }
  const failed = Object.entries(checks).filter(([, c]) => !c.pass).map(([k]) => k);
  results.push({ viewport: v.name, width: v.w, checks, failed });
  console.log(`${failed.length ? 'FAIL' : 'PASS'}  ${v.name} (${v.w}px) — ${Object.entries(checks).map(([k, c]) => `${k}:${c.pass ? 'ok' : 'FAIL'}`).join(' · ')}`);
  await ctx.close();
}

await browser.close();
fs.writeFileSync(path.join(out, 'viewport-qa.json'), JSON.stringify(results, null, 2));
const anyFail = results.some((r) => r.failed.length);
console.log(`\nscreenshots + report -> ${out}`);
if (anyFail) { console.error('viewport-qa: FAILED'); process.exit(1); }
console.log('viewport-qa: OK — all viewports pass rendered checks.');
