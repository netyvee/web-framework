#!/usr/bin/env node
// visual-completion-check.mjs — deterministic HARD VISUAL-COMPLETION gates
// (W-CARE-EXPERIENCE-CLOSURE §2). These are element/attribute/asset detectors on the
// BUILT output — not visual opinion. A failing hard gate exits 1 (blocks sign-off).
//
// Static HTML cannot compute pixel layout, so rendered element-OVERLAP and viewport-
// OVERFLOW are prevented BY CONSTRUCTION in the framework <Shell> (the sticky CTA is
// omitted from the DOM while the mobile nav is open; a bottom spacer reserves space so
// the sticky never obscures the footer/legal) and are asserted here via those
// structural fingerprints (single sticky CTA + footer-clearance spacer). Pixel
// screenshots remain the operator sign-off artifact (§13).
//
// Usage: node visual-completion-check.mjs --site <dir> [--home index.html]

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const opt = (n, d = null) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const siteDir = opt('--site');
const homeFile = opt('--home', 'index.html');
if (!siteDir) { console.error('usage: visual-completion-check.mjs --site <dir> [--home index.html]'); process.exit(1); }

const appDir = path.join(siteDir, '.next', 'server', 'app');
if (!fs.existsSync(appDir)) { console.error(`no build output at ${appDir} — run next build first`); process.exit(1); }
const homePath = path.join(appDir, homeFile);
if (!fs.existsSync(homePath)) { console.error(`homepage not found: ${homePath}`); process.exit(1); }
const home = fs.readFileSync(homePath, 'utf8');

// isolate <header>…</header> and the footer marked data-vf-footer
const headerHtml = (home.match(/<header[\s\S]*?<\/header>/i) ?? [''])[0];
const footerHtml = (home.match(/<footer[^>]*data-vf-footer[\s\S]*?<\/footer>/i) ?? home.match(/<footer[\s\S]*?<\/footer>/i) ?? [''])[0];

// built CSS (for responsive-typography clamp())
let css = '';
const cssDir = path.join(siteDir, '.next', 'static', 'css');
if (fs.existsSync(cssDir)) for (const f of fs.readdirSync(cssDir).filter((f) => f.endsWith('.css'))) css += fs.readFileSync(path.join(cssDir, f), 'utf8');

const results = [];
const gate = (name, pass, detail, hard = true) => results.push({ name, pass, detail, hard });

// 1. header logo present (an <img> inside <header>)
gate('header-logo', /<img\b[^>]*\bsrc=/i.test(headerHtml), 'an <img> in <header>');
// 2. footer logo present
gate('footer-logo', /<img\b[^>]*\bsrc=/i.test(footerHtml), 'an <img> in the footer');
// 3. favicon present (Next emits <link rel="icon"> from app/icon.*)
gate('favicon', /<link[^>]+rel="[^"]*icon[^"]*"/i.test(home), '<link rel="icon"> in <head>');
// 4. OG image present
gate('og-image', /<meta[^>]+property="og:image"/i.test(home), '<meta property="og:image">');
// 5. single governed sticky CTA — exactly ONE fixed-bottom anchor
const stickyMatches = (home.match(/<a\b[^>]*class="[^"]*\bfixed\b[^"]*\bbottom-0\b[^"]*"[^>]*>/gi) ?? []);
gate('single-sticky-cta', stickyMatches.length <= 1, `${stickyMatches.length} fixed bottom-0 CTA(s) (must be ≤1)`);
// 6. footer-clearance spacer (reserves space so the sticky never obscures footer/legal)
gate('footer-clearance', /aria-hidden[^>]*style="[^"]*height:\s*calc\(/i.test(home) || /env\(safe-area-inset-bottom\)/i.test(home), 'a bottom spacer / safe-area padding');
// 7. accessible mobile nav trigger (aria-label + aria-expanded + aria-controls on the hamburger)
gate('mobile-nav-a11y', /aria-label="Open menu"/i.test(headerHtml) && /aria-controls=/i.test(headerHtml) && /aria-expanded=/i.test(headerHtml), 'hamburger has aria-label/expanded/controls');
// 8. responsive typography (clamp in the built CSS)
gate('responsive-typography', /clamp\(/i.test(css), 'clamp() in built CSS');

// advisory: obscured-footer legal — legal/company reg present in the footer
gate('footer-legal', /Company Reg|Reg\.|Privacy|Cookie|Terms/i.test(footerHtml), 'legal/company-reg content in footer', false);

const failedHard = results.filter((r) => r.hard && !r.pass);
for (const r of results) console.log(`${r.pass ? 'PASS' : (r.hard ? 'FAIL' : 'WARN')}  ${r.name} — ${r.detail}`);
if (failedHard.length) {
  console.error(`\nvisual-completion: FAILED — ${failedHard.length} hard gate(s): ${failedHard.map((r) => r.name).join(', ')}`);
  process.exit(1);
}
console.log(`\nvisual-completion: OK — ${results.filter((r) => r.hard).length} hard gates pass (pixel screenshots = operator sign-off).`);
