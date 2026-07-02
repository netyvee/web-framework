#!/usr/bin/env node
/**
 * content-completeness-check.mjs — the SUBSTANCE gate for a render-from-JSON Vigil site.
 *
 * W-STAFFING-CONTENT-AND-ORGANIC-CLOSURE (2026-07-02): a 200/render is NOT completion. The
 * division-isolation gate proves no FOREIGN division leaks; the visual-completion gate proves the
 * SHELL is complete; THIS gate proves each page's CONTENT is complete, connected and indexable for
 * its page type. It reads the committed content/pages/*.json (the render engine's source of truth),
 * so it catches any drift regardless of how the JSON was produced.
 *
 * HARD BLOCKS (exit 1):
 *   canonical missing / not leading-slash / trailing-slash / != slug
 *   SEO title (10–70) / description (50–180) / focus_keyword missing
 *   more or fewer than exactly ONE hero (H1) on an indexable page
 *   duplicate <title> or duplicate canonical across indexable pages
 *   ORPHAN — an indexable, non-legal page with zero internal links
 *   BROKEN LINK — an internal href that resolves to no page
 *   page-type CONTRACT — required section set missing (commercial pages need structured
 *     content + a conversion action; the /blog index needs clickable article cards; the
 *     locations hub cards must be clickable)
 *   FOREIGN NAP — another Vigil division's phone digits appear on a page
 *
 * USAGE: node content-completeness-check.mjs [--site <dir=.>] [--report-only]
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const REPORT_ONLY = args.includes('--report-only');
const SITE = path.resolve(process.cwd(), opt('--site', '.'));
const PAGES_DIR = path.join(SITE, 'content', 'pages');

// The four Vigil division phones (digit signatures). A page may carry only its OWN number.
const DIVISION_PHONES = {
  cleaning: '02030986037',
  security: '02039738892',
  care: '02039738886',
  staffing: '02039738887',
};
const LEGAL = new Set(['/privacy-policy', '/modern-slavery-statement-2', '/equal-opportunities-employer-policy']);
const sig = (s) => String(s).replace(/\D/g, '');

if (!fs.existsSync(PAGES_DIR)) {
  console.error(`FATAL: no content/pages directory at ${PAGES_DIR}`);
  process.exit(2);
}

const files = fs.readdirSync(PAGES_DIR).filter((f) => f.endsWith('.json') && !f.startsWith('_'));
const pages = files.map((f) => ({ file: f, json: JSON.parse(fs.readFileSync(path.join(PAGES_DIR, f), 'utf8')) }));
const slugSet = new Set(pages.map((p) => p.json.slug));

const hard = [];
const add = (page, code, msg) => hard.push({ page, code, msg });

/** Every internal href (leading slash, not // , not an /enquire funnel) a page points at. */
function internalHrefs(json) {
  const out = new Set();
  const walk = (node) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) {
        if (typeof v === 'string'
          && ['href', 'cta_url', 'view_all_url', 'cta_secondary_url'].includes(k)
          && v.startsWith('/') && !v.startsWith('//') && !v.includes('/enquire')) {
          out.add(v);
        } else if (v && typeof v === 'object') {
          walk(v);
        }
      }
    }
  };
  walk(json.sections || []);
  return [...out];
}

const hasType = (json, t) => (json.sections || []).some((s) => s?.type === t);
const heroHasCta = (json) => (json.sections || []).some((s) => s?.type === 'hero' && (s.fields?.cta_url ?? '') !== '');

const titles = new Map();
const canonicals = new Map();

for (const { file, json } of pages) {
  const slug = json.slug ?? `(no slug in ${file})`;
  const seo = json.seo ?? {};
  const type = json.page_type ?? '';
  const noindex = !!seo.noindex;
  const indexable = !noindex;

  // canonical form + == slug
  const canon = seo.canonical ?? '';
  if (canon === '') add(slug, 'canonical', 'SEO canonical missing');
  else {
    if (!canon.startsWith('/')) add(slug, 'canonical', `canonical "${canon}" must start with "/"`);
    if (canon !== '/' && canon.endsWith('/')) add(slug, 'canonical', `canonical "${canon}" must not end with "/"`);
    if (canon !== slug) add(slug, 'canonical', `canonical "${canon}" != slug "${slug}"`);
  }

  // SEO completeness
  const t = String(seo.title ?? '').trim();
  const d = String(seo.description ?? '').trim();
  if (t.length < 10 || t.length > 70) add(slug, 'seo_title', `title length ${t.length} (need 10–70)`);
  if (d.length < 50 || d.length > 180) add(slug, 'seo_description', `description length ${d.length} (need 50–180)`);
  if (String(seo.focus_keyword ?? '').trim() === '') add(slug, 'focus_keyword', 'focus_keyword missing');

  // exactly one hero (one H1)
  const heroes = (json.sections || []).filter((s) => s?.type === 'hero').length;
  if (heroes !== 1) add(slug, 'one_h1', `expected exactly one hero (H1); found ${heroes}`);

  // dup title / canonical (indexable only)
  if (indexable) {
    if (t) { titles.set(t, (titles.get(t) || 0) + 1); }
    if (canon) { canonicals.set(canon, (canonicals.get(canon) || 0) + 1); }
  }

  // connectivity — no orphan (indexable, non-legal)
  const links = internalHrefs(json);
  if (indexable && !LEGAL.has(slug) && links.length === 0) {
    add(slug, 'orphan', 'indexable page has zero internal links');
  }
  // zero broken links
  for (const href of links) {
    if (!slugSet.has(href)) add(slug, 'broken_link', `internal href "${href}" resolves to no page`);
  }

  // page-type contracts
  if (['homepage', 'service', 'borough'].includes(type)) {
    if (!hasType(json, 'service_grid') && !hasType(json, 'faq')) {
      add(slug, 'contract', `${type} must render structured content (service_grid or faq)`);
    }
    if (!hasType(json, 'cta') && !hasType(json, 'contact_form') && !heroHasCta(json)) {
      add(slug, 'contract', `${type} must carry a conversion action (cta / contact_form / hero CTA)`);
    }
  }
  if (type === 'borough' && !hasType(json, 'faq')) {
    add(slug, 'contract', 'borough page must carry a local FAQ');
  }
  if (slug === '/blog') {
    const grid = (json.sections || []).find((s) => s?.type === 'service_grid');
    const cards = grid?.fields?.items ?? [];
    if (cards.length === 0) add(slug, 'contract', 'blog index has no article cards');
    if (cards.some((c) => !c.href)) add(slug, 'contract', 'blog index has a non-clickable article card');
  }
  if (slug === '/locations') {
    const grid = (json.sections || []).find((s) => s?.type === 'service_grid');
    const cards = grid?.fields?.items ?? [];
    if (cards.length === 0 || cards.some((c) => !c.href)) {
      add(slug, 'contract', 'locations hub has a non-clickable area card');
    }
  }

  // foreign NAP — another division's phone anywhere on the page
  const blob = sig(JSON.stringify([json.sections, json.seo, json.title]));
  const own = json.nap?.phone ? sig(json.nap.phone) : null;
  for (const [div, phone] of Object.entries(DIVISION_PHONES)) {
    if (sig(phone) !== own && blob.includes(sig(phone))) {
      add(slug, 'foreign_nap', `contains ${div} division phone (${phone}) — NAP must be this site's number only`);
    }
  }
}

for (const [title, n] of titles) if (n > 1) add('(site)', 'dup_title', `duplicate <title> "${title}" on ${n} pages`);
for (const [canon, n] of canonicals) if (n > 1) add('(site)', 'dup_canonical', `duplicate canonical "${canon}" on ${n} pages`);

// ── output ──
const C = { red: '\x1b[31m', green: '\x1b[32m', dim: '\x1b[2m', reset: '\x1b[0m' };
console.log(`\n=== content-completeness — site=${path.basename(SITE)} | pages=${pages.length} | mode=${REPORT_ONLY ? 'REPORT-ONLY' : 'ENFORCING'} ===`);
if (hard.length) {
  console.log(`\n${C.red}HARD BLOCKS (${hard.length}):${C.reset}`);
  for (const f of hard) console.log(`  ${C.red}✗${C.reset} [${f.code}] ${f.page} — ${f.msg}`);
} else {
  console.log(`\n${C.green}✓ content complete: no orphans, no broken links, contracts + SEO satisfied.${C.reset}`);
}
if (REPORT_ONLY) { console.log('\nREPORT-ONLY: exit 0.'); process.exit(0); }
process.exit(hard.length ? 1 : 0);
