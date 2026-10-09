#!/usr/bin/env node
/**
 * seo-integrity-check.mjs — Vigil website SEO governance gate (Phase 1).
 * Shared engine — F2-07 item B (netyvee/app#344).
 *
 * Config-driven static SEO integrity check for a Next.js (App Router) marketing
 * site. The RULES live here (in @vigil/web-framework); the per-site DATA lives
 * in each consuming repo's seo-governance.config.json and .seo-baseline.json.
 * Adding a new Vigil site = add a config file, not edit this script.
 *
 * Lifted verbatim from netyvee/vigil-cleaning's and netyvee/security's
 * standalone copies, which had diverged by nothing but a comment (the
 * table-header/cell scanning fix from Codex review, netyvee/vigil-cleaning#18,
 * was already present in both). `ROOT` is always `process.cwd()` and nothing
 * in this file uses `__dirname`/`import.meta.url`, so running it from a
 * consuming repo's root — via `node_modules/@vigil/web-framework/bin/` —
 * resolves every config/content/report path against that repo, not this
 * package.
 *
 * See AUDIT/WEBSITE-GOVERNANCE/05-SEO-CICD-ARCHITECTURE.md (in netyvee/app) for the
 * design, and SEO-GOVERNANCE.md (each consuming repo) for the rules every session must follow.
 *
 * HARD BLOCKS (exit 1 — deploy must not proceed):
 *   H_MISSING_CANONICAL   a content page declares no canonical
 *   H_CANONICAL_FORM      canonical != canonicalBase + route (+ slash policy)
 *   H_CANONICAL_REDIRECT  a canonical points at a redirect `source`
 *   H_SITEMAP_CANONICAL   sitemap URL set != indexable canonical set
 *   H_NAP_PHONE           a forbidden phone number appears in the source
 *
 * SOFT BLOCKS (warn; never fail on their own in Phase 1):
 *   S_NO_DESCRIPTION      page has no meta description
 *   S_DUPLICATE_TITLE     two pages share a <title>
 *   S_SCORE_DROP          page SEO score dropped > regressionThreshold vs baseline
 *   S_NO_JSONLD           indexable page emits no application/ld+json / <SchemaMarkup>   (SEO-04 item 8)
 *   S_IMG_ALT             an <img>/<Image> tag is missing an alt= attribute              (SEO-04 item 8)
 *   S_NO_ROBOTS           no app/robots.ts route nor public/robots.txt present (guard)   (SEO-04 item 8)
 *
 * OVERRIDE: a commit message containing [seo-override: reason] downgrades the
 *   OVERRIDABLE hard blocks for THAT commit only (single-use — the next commit
 *   without the flag re-blocks). H_NAP_PHONE and build failures are NEVER
 *   overridable. Every override is appended to AUDIT/OVERRIDE-LOG.md.
 *
 * USAGE (from a consuming repo's root):
 *   node node_modules/@vigil/web-framework/bin/seo-integrity-check.mjs
 *        [--config seo-governance.config.json]
 *        [--report-only]      print findings, always exit 0 (first-run / baseline)
 *        [--update-baseline]  rewrite .seo-baseline.json from current scores
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

// ───────────────────────────── args + config ──────────────────────────────
const args = process.argv.slice(2);
const getFlag = (name) => args.includes(name);
const getOpt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};

const ROOT = process.cwd();
const CONFIG_PATH = path.resolve(ROOT, getOpt('--config', 'seo-governance.config.json'));
const REPORT_ONLY = getFlag('--report-only');
const UPDATE_BASELINE = getFlag('--update-baseline');

if (!fs.existsSync(CONFIG_PATH)) {
  console.error(`FATAL: config not found: ${CONFIG_PATH}`);
  process.exit(2);
}
const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

// D1 (Phase 5): validate the config schema on every run. A missing/invalid
// required field is a hard block — exit non-zero so CI fails and Vercel's
// inverted ignore step cancels the build (fail-safe on a broken config).
const cfgErrors = [];
const reqTop = { site: 'string', domain: 'string', canonicalBase: 'string', trailingSlash: 'boolean' };
for (const [k, t] of Object.entries(reqTop)) {
  if (cfg[k] === undefined || cfg[k] === null) cfgErrors.push(`missing "${k}"`);
  else if (typeof cfg[k] !== t) cfgErrors.push(`"${k}" must be a ${t}`);
}
if (!cfg.nap || typeof cfg.nap !== 'object') {
  cfgErrors.push('missing "nap" object');
} else {
  if (!cfg.nap.phone) cfgErrors.push('missing "nap.phone"');
  if (!cfg.nap.phoneE164) cfgErrors.push('missing "nap.phoneE164"');
}
if (!Array.isArray(cfg.forbiddenClaims) || cfg.forbiddenClaims.length === 0) {
  cfgErrors.push('missing or empty "forbiddenClaims" array');
}
if (cfgErrors.length) {
  console.error('FATAL: seo-governance.config.json is invalid (hard block):\n  - '
    + cfgErrors.join('\n  - '));
  process.exit(2);
}

const BASE = cfg.canonicalBase.replace(/\/$/, '');
const TRAILING = !!cfg.trailingSlash;
const EXCLUDE = cfg.excludeRoutes || ['/api', '/admin', '/portal'];
const SCAN_DIRS = cfg.scanDirs || ['app', 'components', 'lib', 'config'];
const SCAN_DOCS = !!cfg.scanDocs;            // default false: don't block on stale .md
const REGRESSION = cfg.scoring?.regressionThreshold ?? 10;
const BASELINE_PATH = path.resolve(ROOT, cfg.scoring?.baselineFile || '.seo-baseline.json');
const OVERRIDABLE = new Set(cfg.override?.overridableHardRules ||
  ['H_CANONICAL_FORM', 'H_CANONICAL_REDIRECT', 'H_SITEMAP_CANONICAL', 'H_MISSING_CANONICAL']);
const OVERRIDE_LOG = path.resolve(ROOT, 'AUDIT/OVERRIDE-LOG.md');

// ───────────────────────────── helpers ────────────────────────────────────
const findings = { hard: [], soft: [] };
const addHard = (rule, page, message, fix, line) =>
  findings.hard.push({ rule, severity: 'hard', page, line, message, fix });
const addSoft = (rule, page, message, fix) =>
  findings.soft.push({ rule, severity: 'soft', page, message, fix });

/** Normalise any canonical to an absolute URL with no trailing slash (except the
 *  bare root) — used for SLASH-INSENSITIVE comparisons (sitemap set, redirect,
 *  pathOf). For the FORM check (which must catch a wrong trailing slash) use
 *  resolveLiteral() instead, which preserves the slash exactly as authored. */
function normCanonical(val) {
  if (!val) return null;
  let u = val.trim();
  if (u.startsWith('/')) u = BASE + u;          // relative → absolute via base
  u = u.replace(/\/+$/, '');                     // strip trailing slash(es)
  if (u === BASE) u = BASE + '/';                // root keeps its slash
  return u;
}
/** Resolve a canonical to an absolute URL PRESERVING its trailing slash exactly
 *  as authored. A trailing slash here, under trailingSlash:false, means the
 *  rendered canonical points at a URL that 308-redirects and disagrees with the
 *  sitemap — the core "trailing-slash trinity" conflict. */
function resolveLiteral(val) {
  if (!val) return null;
  const u = val.trim();
  return u.startsWith('/') ? BASE + u : u;
}
/** Expected canonical for a route, honouring the trailingSlash policy. */
function expectedCanonical(route) {
  if (route === '/') return BASE + '/';
  return TRAILING ? `${BASE}${route}/` : `${BASE}${route}`;
}
/** Path portion (no domain, no trailing slash) of an absolute/normalised URL. */
function pathOf(absUrl) {
  if (!absUrl) return null;
  const p = absUrl.replace(BASE, '') || '/';
  return p === '/' ? '/' : p.replace(/\/+$/, '');
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', '.git', '.vercel'].includes(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function routeFromPageFile(file) {
  // app/services/x/page.tsx -> /services/x ; app/page.tsx -> /
  let r = file.replace(/\\/g, '/').replace(/^app/, '').replace(/\/page\.tsx$/, '');
  r = r.replace(/\/\([^)]+\)/g, '');             // strip route groups (group)
  if (r === '') r = '/';
  return r;
}
const isExcluded = (route) =>
  EXCLUDE.some((p) => route === p || route.startsWith(p + '/')) || /\[[^\]]+\]/.test(route);

// digit signature = last 10 digits (format-agnostic across 020.../+44...)
const sig = (s) => (s.replace(/\D/g, '').slice(-10));
const forbiddenSigs = new Set((cfg.nap.forbiddenPhones || []).map(sig));

/** Fetch JSON from a CRM API with a timeout; returns null on any failure so an
 *  unreachable CRM degrades to a soft warning rather than blocking the deploy. */
async function fetchJson(url, ms = 12000) {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), ms);
    const res = await fetch(url, { signal: ctl.signal, headers: { Accept: 'application/json' } });
    clearTimeout(t);
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

/** Parse the image-slot interfaces out of types/page-templates.ts → { Interface:
 *  [slotKeys] }. Used to verify the CRM's page_slot_templates never reference a
 *  slot key the website type contract does not define (the Session-37 break). */
function parseTsSlots(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  const src = fs.readFileSync(file, 'utf8');
  for (const iface of ['ImageSlots', 'BoroughImageSlots', 'BlogImageSlots']) {
    const m = src.match(new RegExp(`interface\\s+${iface}\\s*\\{([\\s\\S]*?)\\}`));
    if (!m) continue;
    out[iface] = [...m[1].matchAll(/^\s*(\w+)\??\s*:/gm)].map((x) => x[1]);
  }
  return out;
}

// ── CRM cross-checks (Phase 5 D3 + D4) — run before the NAP scan so the registry
//    can augment the forbidden-number set. An unreachable CRM degrades to a soft
//    warning (never blocks a website deploy on CRM downtime). ─────────────────
const PAGE_TYPE_IFACE = { service: 'ImageSlots', homepage: 'ImageSlots',
                          borough: 'BoroughImageSlots', blog: 'BlogImageSlots' };

// D4: validate NAP against the CRM nap_registry (single source of truth).
if (cfg.crm?.napRegistryApi) {
  const reg = await fetchJson(cfg.crm.napRegistryApi);
  const rows = reg?.registry || reg?.nap || (Array.isArray(reg) ? reg : null);
  if (!rows) {
    addSoft('S_NAP_REGISTRY', 'crm',
      `NAP registry API unreachable (${cfg.crm.napRegistryApi}) — NAP not cross-checked vs registry`,
      'verify CRM availability / endpoint');
  } else {
    const mine = rows.find((r) => r.division === cfg.division);
    if (!mine) {
      addSoft('S_NAP_REGISTRY', cfg.site,
        `division "${cfg.division}" missing from nap_registry`, 'add it to the CRM nap_registry');
    } else if (sig(mine.phone) !== sig(cfg.nap.phone)) {
      addHard('H_NAP_REGISTRY', cfg.site,
        `config nap.phone "${cfg.nap.phone}" != nap_registry "${mine.phone}" for division ${cfg.division}`,
        'sync seo-governance.config.json nap.phone to the CRM nap_registry (single source of truth)');
    }
    // Every OTHER division's registry phone becomes a forbidden number here —
    // data-driven cross-division contamination guard.
    for (const r of (rows || [])) {
      if (r.division !== cfg.division && r.phone) forbiddenSigs.add(sig(r.phone));
    }
  }
}

// D3: slot-contract parity — CRM page_slot_templates keys MUST be a subset of the
// website type contract for each page type. A CRM key not in the TS interface is
// the Session-37 build break; block it before it can ship.
if (cfg.crm?.slotTemplatesApi) {
  const crm = await fetchJson(cfg.crm.slotTemplatesApi);
  const slots = crm?.slots || crm;
  if (!slots || typeof slots !== 'object') {
    addSoft('S_SLOT_CONTRACT', 'crm',
      `slot-template API unreachable (${cfg.crm.slotTemplatesApi}) — slot parity not verified`,
      'verify CRM availability / endpoint');
  } else {
    const ts = parseTsSlots(path.resolve(ROOT, 'types/page-templates.ts'));
    for (const [pageType, keys] of Object.entries(slots)) {
      const iface = PAGE_TYPE_IFACE[pageType];
      if (!iface || !Array.isArray(keys)) continue;
      const allowed = ts[iface] || [];
      const extra = keys.filter((k) => !allowed.includes(k));
      if (extra.length) {
        addHard('H_SLOT_CONTRACT', 'types/page-templates.ts',
          `CRM page_slot_templates for "${pageType}" use key(s) not in ${iface}: ${extra.join(', ')}`,
          'Align the CRM PageSlotTemplateSeeder with types/page-templates.ts (Session-37 class)');
      }
    }
  }
}

// ───────────────────────── collect pages ──────────────────────────────────
const appFiles = walk(path.join(ROOT, 'app')).map((f) => path.relative(ROOT, f).replace(/\\/g, '/'));
const pageFiles = appFiles.filter((f) => /\/page\.tsx$/.test(f) || f === 'app/page.tsx');

const pages = [];
for (const file of pageFiles) {
  const route = routeFromPageFile(file);
  if (isExcluded(route)) continue;
  const src = fs.readFileSync(path.resolve(ROOT, file), 'utf8');

  // Redirect-only stub (e.g. `redirect('/')` from next/navigation, no metadata)
  // is not an indexable content page — skip it entirely.
  const isRedirectStub = /\bredirect\s*\(/.test(src) && /next\/navigation/.test(src)
    && !/export const metadata/.test(src) && !/canonical:/.test(src);
  if (isRedirectStub) continue;

  // canonical: first absolute-or-relative string assigned to a `canonical:` key
  let canonical = null, canonicalLine = null;
  const cm = src.match(/canonical:\s*["'`]([^"'`]+)["'`]/);
  if (cm) {
    canonical = cm[1];
    canonicalLine = src.slice(0, cm.index).split('\n').length;
  }
  // title / description (first string literal for each key in the seo/metadata block)
  const tm = src.match(/title:\s*["'`]([^"'`]+)["'`]/);
  const dm = src.match(/description:\s*["'`]([^"'`]+)["'`]/);
  const noindex = /noIndex:\s*true|robots:\s*{[^}]*index:\s*false/.test(src);

  pages.push({
    file, route, src,
    canonicalRaw: canonical,
    canonical: normCanonical(canonical),
    canonicalLine,
    title: tm ? tm[1] : null,
    description: dm ? dm[1] : null,
    noindex,
  });
}

// netyvee/app#344 F2 Step 5c — a page migrated to the Prose.blocks content
// model (`getPage('<slug>')` + `<ProseBlocks .../>`) moves its rendered copy
// out of page.tsx and into content/pages/<slug>.json. The forbidden-claims
// scan below only ever read `p.src` (the page.tsx source), so a claim
// introduced by a later content-only edit to that JSON would go undetected —
// both for the current warn-only signal and any future hard enforcement.
// Collect referenced content JSON files as their own scannable entries. Each
// entry's `src` is the FLATTENED rendered text (matching what ProseBlocks.tsx
// actually renders), not the raw JSON — a claim split across ProseInline
// nodes (e.g. `["police", {"text":" approved","bold":true}]`) would not
// match a raw-text regex like `(police|government)[ -]approved` because the
// JSON's own object syntax sits between the fragments.
const flattenInline = (n) => (typeof n === 'string' ? n : (n && n.text) || '');

// Locating a fragment's line by re-deriving an expected raw-text encoding
// (`JSON.stringify(frag)`) and searching for it is fundamentally unsound: a
// raw file may use a different but equally valid JSON escaping for the same
// logical string (e.g. `\/` vs `/`), so the derived needle never matches its
// real position — and an unbounded search for the next fragment can then
// latch onto an unrelated, coincidental occurrence anywhere later in the
// file, corrupting every line number after it. Sidestep the whole class of
// escaping mismatches by decoding the raw file's own string literals
// ourselves (one real JSON string decoder, not a guessed re-encoding) and
// matching on the decoded VALUE, which is exactly what `JSON.parse` would
// have produced for that same literal.
function scanStringLiterals(raw) {
  const out = [];
  let line = 1;
  let i = 0;
  const n = raw.length;
  const escapeMap = { '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' };
  while (i < n) {
    const ch = raw[i];
    if (ch === '\n') { line++; i++; continue; }
    if (ch !== '"') { i++; continue; }
    const startLine = line;
    let j = i + 1;
    let value = '';
    while (j < n) {
      const c = raw[j];
      if (c === '\\') {
        const next = raw[j + 1];
        if (next === 'u') { value += String.fromCharCode(parseInt(raw.slice(j + 2, j + 6), 16)); j += 6; continue; }
        value += next in escapeMap ? escapeMap[next] : next;
        j += 2;
        continue;
      }
      if (c === '"') { j += 1; break; }
      if (c === '\n') line++;
      value += c;
      j += 1;
    }
    out.push({ value, line: startLine });
    i = j;
  }
  return out;
}

const contentPages = [];
for (const p of pages) {
  const gm = p.src.match(/getPage\(\s*['"`]([^'"`]+)['"`]\s*\)/);
  if (!gm) continue;
  const contentFile = `content/pages/${gm[1]}.json`;
  const contentPath = path.resolve(ROOT, contentFile);
  if (!fs.existsSync(contentPath)) continue;
  const raw = fs.readFileSync(contentPath, 'utf8');
  let json;
  try { json = JSON.parse(raw); } catch { continue; }

  // Each entry: flattened text to scan, plus its ordered raw literal
  // `fragments` (the ProseInline node text pieces, each verbatim in the raw
  // file) used to locate a real line number.
  const entries = [];
  if (json.seo && json.seo.title) entries.push({ text: json.seo.title, fragments: [json.seo.title] });
  if (json.seo && json.seo.description) entries.push({ text: json.seo.description, fragments: [json.seo.description] });
  for (const section of json.sections || []) {
    for (const block of (section.fields && section.fields.blocks) || []) {
      if (block.type === 'heading') {
        entries.push({ text: block.text || '', fragments: [block.text || ''] });
      } else if (block.type === 'paragraph') {
        const parts = (block.content || []).map(flattenInline);
        entries.push({ text: parts.join(''), fragments: parts });
      } else if (block.type === 'list') {
        for (const item of block.items || []) {
          const parts = item.map(flattenInline);
          entries.push({ text: parts.join(''), fragments: parts });
        }
      } else if (block.type === 'table') {
        // Codex review, netyvee/vigil-cleaning#18: table headers/cells are
        // rendered page copy exactly like heading/paragraph/list text and
        // must be scanned the same way, or a forbidden claim placed in a
        // table silently passes this check while still being live content.
        for (const h of block.headers || []) {
          entries.push({ text: h || '', fragments: [h || ''] });
        }
        for (const row of block.rows || []) {
          for (const cell of row) {
            const parts = (cell || []).map(flattenInline);
            entries.push({ text: parts.join(''), fragments: parts });
          }
        }
      }
    }
  }

  // Entries are collected in document order, matching the order their string
  // literals appear in `raw`. Walk the raw file's own decoded literals once,
  // in order, matching each fragment by VALUE (not by re-derived text) so no
  // escaping difference between how a string is written and how JSON.parse
  // decoded it can ever cause a mismatch.
  const literals = scanStringLiterals(raw);
  let litCursor = 0;
  for (const { text, fragments } of entries) {
    if (!text) continue;
    let line = null;
    for (const frag of fragments) {
      if (!frag) continue;
      let found = -1;
      for (let k = litCursor; k < literals.length; k++) {
        if (literals[k].value === frag) { found = k; break; }
      }
      if (found === -1) continue;
      if (line === null) line = literals[found].line;
      litCursor = found + 1;
    }
    contentPages.push({ file: contentFile, src: text, line });
  }
}

// ───────────────────────── parse next.config redirects ────────────────────
const redirectSources = new Set();
const ncPath = ['next.config.mjs', 'next.config.js'].map((f) => path.resolve(ROOT, f)).find(fs.existsSync);
if (ncPath) {
  const nc = fs.readFileSync(ncPath, 'utf8');
  for (const m of nc.matchAll(/source:\s*["'`]([^"'`]+)["'`]/g)) {
    redirectSources.add(m[1].replace(/\/$/, '').replace(/\/:path\*$/, '')); // base of wildcard
  }
}

// ───────────────────────── parse sitemap ──────────────────────────────────
const sitemapRoutes = new Set();
const smPath = ['app/sitemap.ts', 'app/sitemap.js'].map((f) => path.resolve(ROOT, f)).find(fs.existsSync);
if (smPath) {
  const sm = fs.readFileSync(smPath, 'utf8');
  for (const m of sm.matchAll(/url:\s*["'`]([^"'`]+)["'`]/g)) {
    let u = m[1].replace(/^\$\{[^}]+\}/, '');     // strip ${BASE}
    u = u.replace(BASE, '');
    if (!u.startsWith('/')) continue;
    sitemapRoutes.add(u === '/' ? '/' : u.replace(/\/+$/, ''));
  }
}

// ───────────────────────── CHECKS ─────────────────────────────────────────
// H_MISSING_CANONICAL + H_CANONICAL_FORM + H_CANONICAL_REDIRECT
const canonicalRoutes = new Set();
for (const p of pages) {
  if (p.noindex) continue;
  if (!p.canonicalRaw) {
    addHard('H_MISSING_CANONICAL', p.file,
      `No canonical declared for route ${p.route}`,
      `Add canonical: '${expectedCanonical(p.route)}'`);
    continue;
  }
  const expected = expectedCanonical(p.route);
  // Slash-SENSITIVE comparison: a trailing slash under trailingSlash:false is a
  // real conflict (canonical points at a 308-redirecting URL, disagrees w/ sitemap).
  if (resolveLiteral(p.canonicalRaw) !== expected) {
    addHard('H_CANONICAL_FORM', p.file,
      `Canonical "${p.canonicalRaw}" != expected "${expected}"`,
      `Set canonical to "${expected}" (trailingSlash=${TRAILING})`, p.canonicalLine);
  }
  const cp = pathOf(p.canonical);
  if (cp && cp !== '/' && redirectSources.has(cp)) {
    addHard('H_CANONICAL_REDIRECT', p.file,
      `Canonical path ${cp} is a redirect source`,
      `Canonical must point at the redirect destination, not the source`, p.canonicalLine);
  }
  canonicalRoutes.add(pathOf(expected));
}

// H_SITEMAP_CANONICAL — both directions
for (const r of sitemapRoutes) {
  if (!canonicalRoutes.has(r)) {
    // is it a real route at all?
    const isRoute = pages.some((p) => p.route === r);
    addHard('H_SITEMAP_CANONICAL', 'app/sitemap.ts',
      `Sitemap lists ${r} but no indexable page canonicalises to it` +
        (isRoute ? ' (page exists but is excluded/noindex)' : ' (no such page)'),
      isRoute ? `Remove ${r} from sitemap or make the page indexable`
              : `Remove ${r} from sitemap (no page) — or create the page`);
  }
}
for (const r of canonicalRoutes) {
  if (!sitemapRoutes.has(r)) {
    addHard('H_SITEMAP_CANONICAL', 'app/sitemap.ts',
      `Indexable page ${r} is missing from the sitemap`,
      `Add { url: "${r}", ... } to app/sitemap.ts`);
  }
}

// H_NAP_PHONE — forbidden numbers anywhere in scanned source.
// SCAN_DIRS includes "app", so this checks EVERY page file (app/**/page.tsx),
// not just layout — a wrong/foreign number on any page blocks the deploy.
const scanExts = SCAN_DOCS ? ['.tsx', '.ts', '.jsx', '.js', '.json', '.md']
                           : ['.tsx', '.ts', '.jsx', '.js', '.json'];
const scanFiles = SCAN_DIRS.flatMap((d) => walk(path.join(ROOT, d)))
  .map((f) => path.relative(ROOT, f).replace(/\\/g, '/'))
  .filter((f) => scanExts.includes(path.extname(f)) && !f.endsWith('seo-governance.config.json'));
const pageFileCount = scanFiles.filter((f) => /\/page\.tsx$/.test(f) || f === 'app/page.tsx').length;
const phoneRe = /(?:\+?44\s?|0)(?:\d[\s().-]?){9,11}\d/g;
for (const f of scanFiles) {
  const src = fs.readFileSync(path.resolve(ROOT, f), 'utf8');
  for (const m of src.matchAll(phoneRe)) {
    const s = sig(m[0]);
    if (forbiddenSigs.has(s)) {
      const line = src.slice(0, m.index).split('\n').length;
      addHard('H_NAP_PHONE', f,
        `Forbidden phone "${m[0].trim()}" (this site's number is ${cfg.nap.phone})`,
        `Replace with ${cfg.nap.phone} / ${cfg.nap.phoneE164}`, line);
    }
  }
}

// H_FORBIDDEN_CLAIM — banned marketing claims in RENDERED page copy
// (ACS, ISO certified, NN% satisfaction, 32 boroughs, police/government approved,
// award-winning). Patterns come from the config so the rule is data, not code.
// Scoped to the collected `pages` (real marketing page.tsx, excluding /api, /admin,
// /portal and redirect stubs) so agent/API code that merely *lists* the forbidden
// terms in a prompt does not false-positive. Also scans `contentPages` — the
// content/pages/*.json files a migrated page's copy now actually lives in — so
// a Prose.blocks page isn't invisible to this gate (see the contentPages
// collection above).
// Enforcement is config-gated: warn-only by default (existing live copy still
// carries legacy claims pending founder-reviewed content cleanup), flipped to a
// deploy-blocking hard block by setting forbiddenClaimsEnforce:true once clean.
const forbiddenClaims = cfg.forbiddenClaims || [];
const claimEnforce = !!cfg.forbiddenClaimsEnforce;
if (forbiddenClaims.length) {
  for (const p of [...pages, ...contentPages]) {
    for (const claim of forbiddenClaims) {
      let re;
      try { re = new RegExp(claim, 'i'); } catch { continue; }
      const m = p.src.match(re);
      if (m) {
        const line = p.line != null ? p.line : p.src.slice(0, m.index).split('\n').length;
        const message = `Forbidden marketing claim "${m[0].trim()}" (pattern: /${claim}/i)`;
        const fix = 'Remove the forbidden claim — see SEO-GOVERNANCE.md / CLAUDE.md FORBIDDEN list';
        if (claimEnforce) {
          addHard('H_FORBIDDEN_CLAIM', p.file, message, fix, line);
        } else {
          addSoft('S_FORBIDDEN_CLAIM', p.file, `${message} [line ${line}]`, fix);
        }
      }
    }
  }
}

// ───────────────────────── SEO-04 item 8 — additional SOFT checks ──────────
// Warn-only on-page signals. These NEVER add to findings.hard, so they surface
// gaps without ever failing an existing build (exit code unaffected). All are
// scoped to the already-collected, non-excluded `pages` and skip noindex pages.

// S_NO_JSONLD — an indexable page emits no JSON-LD structured data. A page is
// covered if its source renders an application/ld+json script directly OR uses
// the shared <SchemaMarkup> component (which emits one).
for (const p of pages) {
  if (p.noindex) continue;
  const hasJsonLd = /application\/ld\+json/.test(p.src) || /\bSchemaMarkup\b/.test(p.src);
  if (!hasJsonLd) {
    addSoft('S_NO_JSONLD', p.file,
      `No JSON-LD structured data on indexable route ${p.route}`,
      'Emit an application/ld+json script (or use <SchemaMarkup schema={...} />)');
  }
}

// S_IMG_ALT — <img> / next/image <Image> tags in the page source that are
// missing an alt= attribute (accessibility + image SEO). [^>]* spans multi-line
// JSX tags; \b guards against <ImageGallery> etc.
for (const p of pages) {
  if (p.noindex) continue;
  let missingAlt = 0;
  for (const m of p.src.matchAll(/<(?:img|Image)\b[^>]*>/g)) {
    if (!/\balt\s*=/.test(m[0])) missingAlt++;
  }
  if (missingAlt) {
    addSoft('S_IMG_ALT', p.file,
      `${missingAlt} <img>/<Image> tag(s) on ${p.route} missing an alt= attribute`,
      'Add a descriptive alt="" to every image (empty alt only for decorative)');
  }
}

// S_NO_ROBOTS — guard (fires once): warn if neither an app/robots route nor a
// public/robots.txt is present. Both Vigil sites ship one, so this should pass.
const hasRobots = ['app/robots.ts', 'app/robots.js', 'public/robots.txt']
  .some((f) => fs.existsSync(path.resolve(ROOT, f)));
if (!hasRobots) {
  addSoft('S_NO_ROBOTS', 'app/robots.ts',
    'No robots route (app/robots.ts) nor public/robots.txt found',
    'Add an app/robots.ts route or a public/robots.txt');
}

// ───────────────────────── SCORING + SOFT BLOCKS ──────────────────────────
const titles = new Map();
const scores = {};
for (const p of pages) {
  if (p.noindex || isExcluded(p.route)) continue;
  let score = 0;
  const expected = expectedCanonical(p.route);
  if (resolveLiteral(p.canonicalRaw) === expected) score += 30; else if (p.canonicalRaw) score += 10;
  if (p.title && p.title.length >= 10 && p.title.length <= 70) score += 20; else if (p.title) score += 10;
  if (p.description && p.description.length >= 50 && p.description.length <= 180) score += 20;
  else if (p.description) score += 10;
  if (sitemapRoutes.has(pathOf(expected))) score += 15;
  // uniqueness handled after the loop; provisional +15, deducted on dup
  score += 15;
  scores[p.route] = score;

  if (!p.description) addSoft('S_NO_DESCRIPTION', p.file, `No meta description for ${p.route}`,
    'Add a 110-160 char meta description');
  if (p.title) {
    if (!titles.has(p.title)) titles.set(p.title, []);
    titles.get(p.title).push(p);
  }
}
for (const [title, ps] of titles) {
  if (ps.length > 1) {
    for (const p of ps) {
      scores[p.route] -= 15;
      addSoft('S_DUPLICATE_TITLE', p.file,
        `Duplicate <title> "${title}" shared by ${ps.length} pages`,
        'Make each page title unique');
    }
  }
}

// S_SCORE_DROP vs baseline
let baseline = {};
if (fs.existsSync(BASELINE_PATH)) {
  try { baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8')).scores || {}; } catch { /* ignore */ }
}
for (const [route, score] of Object.entries(scores)) {
  const prev = baseline[route];
  if (prev !== undefined && prev - score > REGRESSION) {
    addSoft('S_SCORE_DROP', route,
      `SEO score dropped ${prev} → ${score} (> ${REGRESSION})`,
      'Investigate the regression before deploying');
  }
}

// ───────────────────────── OVERRIDE handling ──────────────────────────────
function commitMessage() {
  if (process.env.SEO_COMMIT_MSG) return process.env.SEO_COMMIT_MSG;
  try { return execSync('git log -1 --pretty=%B', { encoding: 'utf8' }); } catch { return ''; }
}
function commitSha() {
  try { return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim(); } catch { return 'unknown'; }
}
const msg = commitMessage();
const overrideMatch = msg.match(/\[seo-override:\s*([^\]]+)\]/i);

let overridden = [];
if (overrideMatch) {
  const reason = overrideMatch[1].trim();
  const before = findings.hard.length;
  const kept = [];
  for (const f of findings.hard) {
    if (OVERRIDABLE.has(f.rule)) overridden.push(f);
    else kept.push(f);
  }
  if (overridden.length > 0 && !REPORT_ONLY) {
    findings.hard = kept;
    const entry = `\n## ${commitSha()} — [seo-override]\n` +
      `- Site: ${cfg.site}\n- Reason: ${reason}\n- Overrode ${overridden.length} hard block(s): ` +
      overridden.map((o) => o.rule).join(', ') +
      `\n- NOTE: single-use — applies to commit ${commitSha()} only.\n`;
    try {
      fs.mkdirSync(path.dirname(OVERRIDE_LOG), { recursive: true });
      if (!fs.existsSync(OVERRIDE_LOG)) fs.writeFileSync(OVERRIDE_LOG, '# SEO Override Log\n');
      fs.appendFileSync(OVERRIDE_LOG, entry);
    } catch (e) { console.error('WARN: could not write override log:', e.message); }
    console.log(`\n[seo-override] Downgraded ${overridden.length} overridable hard block(s). ` +
      `Logged to ${path.relative(ROOT, OVERRIDE_LOG)}. NAP/build are never overridable.`);
    void before;
  }
}

// ───────────────────────── OUTPUT ─────────────────────────────────────────
const C = { red: '\x1b[31m', yellow: '\x1b[33m', green: '\x1b[32m', dim: '\x1b[2m', reset: '\x1b[0m' };
console.log(`\n=== SEO Integrity Check — site=${cfg.site} | pages=${pages.length} | ` +
  `NAP-scanned page files=${pageFileCount} | ` +
  `mode=${REPORT_ONLY ? 'REPORT-ONLY' : 'ENFORCING'} ===`);

if (findings.hard.length) {
  console.log(`\n${C.red}HARD BLOCKS (${findings.hard.length}):${C.reset}`);
  for (const f of findings.hard) {
    console.log(`  ${C.red}✗${C.reset} [${f.rule}] ${f.page}${f.line ? ':' + f.line : ''}`);
    console.log(`      ${f.message}`);
    console.log(`      ${C.dim}fix: ${f.fix}${C.reset}`);
  }
} else {
  console.log(`\n${C.green}✓ No hard blocks.${C.reset}`);
}
if (overridden.length) {
  console.log(`\n${C.yellow}OVERRIDDEN (single-use, logged): ${overridden.map((o) => o.rule).join(', ')}${C.reset}`);
}
if (findings.soft.length) {
  console.log(`\n${C.yellow}SOFT WARNINGS (${findings.soft.length}):${C.reset}`);
  for (const f of findings.soft) console.log(`  ${C.yellow}!${C.reset} [${f.rule}] ${f.page} — ${f.message}`);
} else {
  console.log(`\n${C.green}✓ No soft warnings.${C.reset}`);
}

// machine-readable report
const report = {
  site: cfg.site, pages: pages.length,
  result: findings.hard.length ? 'fail' : 'pass',
  hardBlocks: findings.hard, softBlocks: findings.soft,
  overridden: overridden.map((o) => o.rule), scores,
};
fs.writeFileSync(path.resolve(ROOT, 'seo-integrity-report.json'), JSON.stringify(report, null, 2));

// baseline write: on first run, on --update-baseline, or on a clean enforcing run
if (UPDATE_BASELINE || !fs.existsSync(BASELINE_PATH) || (!findings.hard.length && !REPORT_ONLY)) {
  fs.writeFileSync(BASELINE_PATH, JSON.stringify({ updatedAt: null, site: cfg.site, scores }, null, 2));
  console.log(`\n${C.dim}Baseline written: ${path.relative(ROOT, BASELINE_PATH)}${C.reset}`);
}

// exit
if (REPORT_ONLY) { console.log('\nREPORT-ONLY: exit 0.'); process.exit(0); }
if (findings.hard.length) { console.log(`\n${C.red}DEPLOY BLOCKED: ${findings.hard.length} hard block(s).${C.reset}`); process.exit(1); }
console.log(`\n${C.green}PASS.${C.reset}`); process.exit(0);
