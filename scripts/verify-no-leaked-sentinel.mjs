#!/usr/bin/env node
/**
 * verify-no-leaked-sentinel.mjs — live-domain crawl asserting no page serves the
 * unassigned-image sentinel (F2-06 item A, netyvee/app#344).
 *
 * The CRM Page Manager always writes an image-slot object into a committed page
 * — a real image or the sentinel path (SENTINEL_IMAGE_PATH in ../src/types.ts) —
 * when a template slot exists but has no real assignment yet (a genuine
 * CONTENT_DEPENDENCY, GROWTH-RUNTIME-CAPABILITY-READINESS-01 / #1519). A build-time
 * scan of the local build output can prove the fix against what was just built;
 * it cannot prove what is actually LIVE. This crawls every URL in the live
 * sitemap and asserts none of them serve the sentinel path anywhere in their HTML
 * (body or metadata).
 *
 * Lifted, mechanism only, from netyvee/vigil-cleaning's own
 * scripts/ops/verify-sentinel-safety-live.mjs (#23, #1519) — same crawl-and-scan
 * logic, parameterised by --base instead of reading that repo's own
 * ops/vercel-policy.json, so every consumer calls the same script instead of
 * each maintaining its own copy.
 *
 * USAGE (run after a deploy, from the site repo root):
 *   node node_modules/@vigil/web-framework/scripts/verify-no-leaked-sentinel.mjs --base https://cleaning.vigilservices.co.uk
 *   # or: BASE_URL=https://cleaning.vigilservices.co.uk node .../verify-no-leaked-sentinel.mjs
 *   # override the sentinel path if a consumer's ever diverges from the shared default:
 *   #   --sentinel /placeholder-image.svg
 *
 * DEFAULT_SENTINEL below is a literal copy, not an import, of src/types.ts's
 * SENTINEL_IMAGE_PATH: this script runs standalone via plain `node` (as every
 * other script in this directory does — none import from src/*.ts, which would
 * need a TS loader the consuming repo's own `node` invocation doesn't carry).
 * Keep the two in sync; a type-level test in this package's own suite asserts it.
 */
const DEFAULT_SENTINEL = '/placeholder-image.svg';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };

const base = (process.env.BASE_URL ?? opt('--base', '')).replace(/\/$/, '');
const sentinel = opt('--sentinel', DEFAULT_SENTINEL);

if (!base) {
  console.error('verify-no-leaked-sentinel: --base <https://example.com> (or BASE_URL) is required');
  process.exit(1);
}

const sitemapXml = await (await fetch(`${base}/sitemap.xml?t=${Date.now()}`, { headers: { 'cache-control': 'no-cache' } })).text();
const urls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (urls.length === 0) {
  console.log(JSON.stringify({ pass: false, reason: 'sitemap.xml returned no <loc> entries' }));
  process.exit(1);
}

const results = [];
for (const url of urls) {
  const res = await fetch(`${url}?t=${Date.now()}`, { headers: { 'cache-control': 'no-cache' } });
  const html = res.ok ? await res.text() : '';
  const leaked = html.includes(sentinel);
  results.push({ url, status: res.status, sentinel_leaked: leaked });
}

const failures = results.filter((r) => r.sentinel_leaked || r.status >= 400);
console.log(JSON.stringify({ pass: failures.length === 0, pages_checked: results.length, failures }, null, 2));
process.exit(failures.length === 0 ? 0 : 1);
