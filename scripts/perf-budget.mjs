#!/usr/bin/env node
/**
 * perf-budget.mjs — Core Web Vitals budget gate for any @vigil/web-framework site.
 *
 * Promoted from staffing/tests/perf/lcp-probe.mjs (Q1.P1, EOS §18) so Care + every future
 * framework site inherits one perf harness instead of copying it. Division-agnostic: it takes a
 * BASE_URL and a route list, drives the consuming repo's already-installed Playwright chromium
 * against a warmed PRODUCTION build (next start), reports median LCP/CLS/TTFB/FCP per route, and
 * FAILS (exit 1) on a budget breach unless --report-only.
 *
 * It imports `@playwright/test` from the CONSUMING repo's node_modules (like the framework's other
 * shipped scripts run downstream) — the framework itself carries no Playwright dependency.
 *
 * INP (<200ms) needs field data / a scripted user-flow trace — flagged, never synthesised.
 *
 * USAGE (run from the site repo root, after `next build` && `next start -p <port>`):
 *   BASE_URL=http://localhost:3220 node node_modules/@vigil/web-framework/scripts/perf-budget.mjs \
 *     --routes "/,/healthcare-assistants" --lcp 2500 --cls 0.1
 *   # or point --routes at a JSON file: --routes ./tests/perf/routes.json  (array of path strings)
 *   # advisory (never fails the build): add --report-only
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const REPORT_ONLY = args.includes('--report-only');

const BASE = process.env.BASE_URL ?? opt('--base', 'http://localhost:3000');
const LCP_BUDGET = Number(opt('--lcp', '2500'));   // ms
const CLS_BUDGET = Number(opt('--cls', '0.1'));
const RUNS = Number(opt('--runs', '5'));
const VW = Number(opt('--viewport-width', '390'));  // mobile profile by default
const VH = Number(opt('--viewport-height', '844'));

function resolveRoutes() {
  const r = opt('--routes', '/');
  if (r.endsWith('.json') && fs.existsSync(r)) {
    const arr = JSON.parse(fs.readFileSync(r, 'utf8'));
    if (Array.isArray(arr) && arr.every((x) => typeof x === 'string')) return arr;
    throw new Error(`--routes file ${r} must be a JSON array of path strings`);
  }
  return r.split(',').map((s) => s.trim()).filter(Boolean);
}
const ROUTES = resolveRoutes();

function vitalsScript() {
  return new Promise((resolve) => {
    const out = { lcp: 0, cls: 0 };
    new PerformanceObserver((l) => { for (const e of l.getEntries()) out.lcp = e.startTime; })
      .observe({ type: 'largest-contentful-paint', buffered: true });
    let cls = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) cls += e.value; })
      .observe({ type: 'layout-shift', buffered: true });
    setTimeout(() => {
      const nav = performance.getEntriesByType('navigation')[0] || {};
      const fcp = (performance.getEntriesByName('first-contentful-paint')[0] || {}).startTime || 0;
      out.cls = cls; out.ttfb = nav.responseStart || 0; out.fcp = fcp;
      resolve(out);
    }, 2500);
  });
}

const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

const b = await chromium.launch();
const results = {};
for (const route of ROUTES) {
  const runs = [];
  for (let i = 0; i < RUNS; i++) {
    const ctx = await b.newContext({ viewport: { width: VW, height: VH } });
    const p = await ctx.newPage();
    await p.goto(BASE + route, { waitUntil: 'load' });
    runs.push(await p.evaluate(vitalsScript));
    await ctx.close();
  }
  results[route] = {
    lcp_ms: Math.round(median(runs.map((r) => r.lcp))),
    fcp_ms: Math.round(median(runs.map((r) => r.fcp))),
    ttfb_ms: Math.round(median(runs.map((r) => r.ttfb))),
    cls: +median(runs.map((r) => r.cls)).toFixed(3),
  };
}
await b.close();

const C = { red: '\x1b[31m', green: '\x1b[32m', dim: '\x1b[2m', reset: '\x1b[0m' };
console.log(`\n=== perf-budget — base=${BASE} | routes=${ROUTES.length} | budgets LCP<${LCP_BUDGET}ms CLS<${CLS_BUDGET} | mode=${REPORT_ONLY ? 'REPORT-ONLY' : 'ENFORCING'} ===`);
console.log(JSON.stringify(results, null, 2));

let breaches = 0;
for (const [r, m] of Object.entries(results)) {
  const lcpOk = m.lcp_ms < LCP_BUDGET, clsOk = m.cls < CLS_BUDGET;
  if (!lcpOk || !clsOk) breaches++;
  const mark = (ok) => (ok ? `${C.green}PASS${C.reset}` : `${C.red}FAIL${C.reset}`);
  console.log(`  ${r}: LCP ${m.lcp_ms}ms ${mark(lcpOk)} | CLS ${m.cls} ${mark(clsOk)}`);
}
console.log(`${C.dim}(INP <200ms needs field/user-flow data — flagged, not measured here.)${C.reset}`);

if (breaches) {
  console.log(`\n${C.red}✗ ${breaches} route(s) breached budget.${C.reset}`);
} else {
  console.log(`\n${C.green}✓ all ${ROUTES.length} route(s) within budget.${C.reset}`);
}
if (REPORT_ONLY) { console.log('REPORT-ONLY: exit 0.'); process.exit(0); }
process.exit(breaches ? 1 : 0);
