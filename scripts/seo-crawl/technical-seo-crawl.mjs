#!/usr/bin/env node
/**
 * technical-seo-crawl.mjs — TECHNICAL-SEO-ASSURANCE-01 (#344), Phase B: an independent, READ-ONLY crawl of the RENDERED public Vigil sites.
 *
 * WHY IT EXISTS. The CRM's SEO surfaces read the sites' own `/api/health-check` (which, called without `mode`, audits ten hard-coded pages) and
 * the static `check:seo` source gate. Neither follows every link, fetches every image, reconciles the sitemap against live routes or looks at the
 * HTTP status of what a visitor can actually reach. This script does, using none of the sites' own code, so a defect cannot hide in a shared bug.
 *
 * COVERAGE (v2): beyond `<a>` pages it also checks, once per URL, internal links to FILES (pdf, json, xml...) and to query-string URLs, and every same-site
 * script, stylesheet, icon, preload, alternate and manifest reference. A URL that fails a HEAD is re-requested with GET before it is reported, so a HEAD-only
 * refusal is a NOTICE and never an ERROR. Every URL the crawl discovers is logged with its kind and referrers (`urls` in <site>.findings.json) and
 * `--probe-file` takes an externally reported URL list (for example another crawler's export) and reports, for each, its live status and whether this crawl found it.
 *
 * WHAT IT NEVER DOES. GET and HEAD only. It never sends a body, a cookie or a credential, never submits a form, never follows a redirect off the
 * audited host, and only ever contacts the hosts in SITES (below). It sleeps between requests, runs a handful in parallel and stops at --max-pages.
 * It skips /api/, /admin and /_next/ (images served through /_next/image are checked as images). It does not execute JavaScript: the sites are
 * server-rendered, and a page whose metadata only appears after hydration is reported by the rules below as missing, which is what a crawler sees.
 *
 *   node scripts/seo-crawl/technical-seo-crawl.mjs --site security|cleaning|care|staffing|main|all [--out DIR] [--max-pages 400]
 *        [--concurrency 3] [--delay-ms 250] [--max-depth 8] [--probe-file urls.txt]
 *        [--origin http://127.0.0.1:3000] [--baseline seo-crawl-baseline.json] [--fail-on-new-errors]
 *
 * LOOPBACK (--origin): crawl a locally started build of ONE site. URLs stay in production-host space (canonical, sitemap, og:url and links are compared
 * as the production URLs they are) but every request goes to the loopback origin; the production host is never requested. Only http://127.0.0.1,
 * http://localhost and http://[::1] are accepted. Deployment-only checks (http->https) are skipped in this mode.
 *
 * GATE (--baseline, --fail-on-new-errors): only ERROR-class findings gate; warnings and notices never do. A finding is accepted debt when a baseline entry
 * names its rule and page path (optionally `detail_includes`), has a reason and an owner, and has not expired; `expires` may be at most 90 days ahead. An expired
 * entry stops covering its finding. Entries with no matching finding are reported as removable. Without --baseline every ERROR is new.
 *
 * Writes <out>/<site>.findings.json, <out>/register.json (every finding, de-duplicated by site + url + rule + detail), <out>/register.md and, with a gate, <out>/gate.json.
 * Exit 0 when the crawl completed (findings are data, not failure); 1 when --fail-on-new-errors and there is a new ERROR; 2 for bad input; 3 when a site could not be reached at all (3 wins over 1).
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const THRESHOLD_FILE = new URL('./thresholds.json', import.meta.url);
export const THRESHOLDS = JSON.parse(fs.readFileSync(THRESHOLD_FILE, 'utf8'));
const [TITLE_MIN, TITLE_MAX] = THRESHOLDS.title.target;
const [DESC_MIN, DESC_MAX] = THRESHOLDS.description.target;

/** Short hash of the engine (this file + the thresholds) so a stale copy is visible in the register. */
export function engineHash() {
  const h = crypto.createHash('sha256');
  h.update(fs.readFileSync(new URL(import.meta.url))); h.update(fs.readFileSync(THRESHOLD_FILE));
  return h.digest('hex').slice(0, 12);
}

/** The only non-production origin the crawler will request: a loopback http origin with no path. */
export function assertLoopbackOrigin(value) {
  let u; try { u = new URL(value); } catch { throw new Error(`--origin is not a URL: ${value}`); }
  const okHost = ['127.0.0.1', 'localhost', '[::1]'].includes(u.hostname);
  if (u.protocol !== 'http:' || !okHost || u.username || u.password || u.pathname !== '/' || u.search || u.hash) throw new Error(`--origin must be http://127.0.0.1, http://localhost or http://[::1] (optional port), nothing else: ${value}`);
  return u.origin;
}

export const SITES = {
  security: 'https://security.vigilservices.co.uk',
  cleaning: 'https://cleaning.vigilservices.co.uk',
  care: 'https://care.vigilservices.co.uk',
  staffing: 'https://staffing.vigilservices.co.uk',
  main: 'https://vigilservices.co.uk',
};

const UA = 'VigilTechnicalSeoAudit/1.0 (+read-only owner crawl; GET and HEAD only)';
const SKIP_PATH = /^\/(api|admin|_next\/static|_next\/data|cdn-cgi)(\/|$)/;
const RES_SKIP = /^\/(api|admin|cdn-cgi)(\/|$)/;
const ASSET_EXT = /\.(?:png|jpe?g|gif|webp|avif|svg|ico|css|js|mjs|map|woff2?|ttf|otf|pdf|zip|xml|txt|json|mp4|webm)$/i;

// rule -> [severity, class hint]. The class is a HINT for triage (CODE | CONTENT | CONFIG | DEPLOYMENT | EXTERNAL), never a verdict.
export const RULES = {
  INTERNAL_URL_ERROR: ['ERROR', 'CODE'],
  BROKEN_INTERNAL_LINK: ['ERROR', 'CONTENT'],
  BROKEN_IMAGE: ['ERROR', 'CONTENT'],
  BROKEN_FILE_LINK: ['ERROR', 'CONTENT'],
  BROKEN_RESOURCE: ['ERROR', 'CODE'],
  HEAD_GET_MISMATCH: ['NOTICE', 'CONFIG'],
  SOFT_404: ['ERROR', 'CODE'],
  REDIRECT_LOOP: ['ERROR', 'CONFIG'],
  REDIRECT_TO_ERROR: ['ERROR', 'CONFIG'],
  REDIRECT_CHAIN: ['WARNING', 'CONFIG'],
  INTERNAL_LINK_REDIRECTS: ['NOTICE', 'CONTENT'],
  EXTERNAL_REDIRECT: ['NOTICE', 'CONFIG'],
  CANONICAL_MISSING: ['ERROR', 'CODE'],
  CANONICAL_TARGET_BAD: ['ERROR', 'CODE'],
  CANONICAL_MISMATCH: ['WARNING', 'CODE'],
  CANONICAL_MULTIPLE: ['ERROR', 'CODE'],
  NOINDEX_IN_SITEMAP: ['ERROR', 'CONFIG'],
  NOINDEX_PAGE: ['NOTICE', 'CONFIG'],
  SITEMAP_MISSING: ['ERROR', 'CONFIG'],
  SITEMAP_URL_NOT_200: ['ERROR', 'CONFIG'],
  SITEMAP_URL_REDIRECTS: ['ERROR', 'CONFIG'],
  SITEMAP_URL_NON_CANONICAL: ['WARNING', 'CONFIG'],
  INDEXABLE_NOT_IN_SITEMAP: ['WARNING', 'CONFIG'],
  ORPHAN_PAGE: ['WARNING', 'CONTENT'],
  DEEP_PAGE: ['NOTICE', 'CONTENT'],
  ROBOTS_MISSING: ['ERROR', 'CONFIG'],
  ROBOTS_DISALLOWS_ALL: ['ERROR', 'CONFIG'],
  ROBOTS_NO_SITEMAP: ['WARNING', 'CONFIG'],
  ROBOTS_BLOCKS_SITEMAP_URL: ['ERROR', 'CONFIG'],
  XROBOTS_NOINDEX: ['WARNING', 'CONFIG'],
  HTTP_NOT_REDIRECTED: ['ERROR', 'DEPLOYMENT'],
  WWW_VARIANT: ['NOTICE', 'DEPLOYMENT'],
  MIXED_CONTENT: ['ERROR', 'CODE'],
  INSECURE_INTERNAL_LINK: ['WARNING', 'CONTENT'],
  TITLE_MISSING: ['ERROR', 'CODE'],
  TITLE_DUPLICATE: ['WARNING', 'CONTENT'],
  TITLE_LENGTH: ['WARNING', 'CONTENT'],
  DESCRIPTION_MISSING: ['WARNING', 'CONTENT'],
  DESCRIPTION_DUPLICATE: ['WARNING', 'CONTENT'],
  DESCRIPTION_LENGTH: ['WARNING', 'CONTENT'],
  H1_MISSING: ['WARNING', 'CODE'],
  H1_MULTIPLE: ['WARNING', 'CODE'],
  OG_INCOMPLETE: ['WARNING', 'CODE'],
  TWITTER_CARD_MISSING: ['NOTICE', 'CODE'],
  JSONLD_MISSING: ['NOTICE', 'CODE'],
  JSONLD_INVALID: ['ERROR', 'CODE'],
  IMG_ALT_MISSING: ['WARNING', 'CONTENT'],
  LANG_MISSING: ['NOTICE', 'CODE'],
  VIEWPORT_MISSING: ['WARNING', 'CODE'],
  QUERY_URL_LINKED: ['NOTICE', 'CONTENT'],
  FETCH_FAILED: ['ERROR', 'DEPLOYMENT'],
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ATTR = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
const decode = (s) => String(s ?? '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();

function attrsOf(tag) {
  const out = {};
  const inner = tag.replace(/^<\w+/, '').replace(/\/?>$/, '');
  for (const m of inner.matchAll(ATTR)) out[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4] ?? '');
  return out;
}

/** Pure HTML analysis: everything a crawler can read from one rendered page. Exported for the tests. */
export function analyseHtml(html, pageUrl) {
  const jsonLd = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  const body = html.replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ');
  const metas = [...body.matchAll(/<meta\b[^>]*>/gi)].map((m) => attrsOf(m[0]));
  const metaBy = (k, v) => metas.filter((m) => (m[k] || '').toLowerCase() === v).map((m) => m.content ?? '');
  const links = [...body.matchAll(/<link\b[^>]*>/gi)].map((m) => attrsOf(m[0]));
  const canonicals = links.filter((l) => (l.rel || '').toLowerCase().split(/\s+/).includes('canonical')).map((l) => l.href).filter(Boolean);
  const title = decode((body.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
  const h1s = [...body.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => decode(m[1].replace(/<[^>]+>/g, ' '))).filter(Boolean);
  const anchors = [...body.matchAll(/<a\b[^>]*>/gi)].map((m) => attrsOf(m[0])).filter((a) => a.href);
  const imgs = [...body.matchAll(/<img\b[^>]*>/gi)].map((m) => attrsOf(m[0]));
  const resources = [
    ...[...body.matchAll(/<(?:script|iframe|audio|video|source|embed)\b[^>]*>/gi)].map((m) => attrsOf(m[0]).src),
    ...links.filter((l) => !(l.rel || '').toLowerCase().split(/\s+/).includes('canonical')).map((l) => l.href),
  ].filter(Boolean);
  const subresources = [
    ...[...body.matchAll(/<(?:script|iframe|audio|video|source|embed)\b[^>]*>/gi)].map((m) => attrsOf(m[0]).src),
    ...imgs.map((i) => i.src),
    ...links.filter((l) => /stylesheet|icon|preload/i.test(l.rel || '')).map((l) => l.href),
  ].filter(Boolean);
  const robotsMeta = metaBy('name', 'robots').join(',').toLowerCase() + ',' + metaBy('name', 'googlebot').join(',').toLowerCase();
  return {
    title, h1s,
    description: decode(metaBy('name', 'description')[0] ?? ''),
    canonicals,
    noindex: /noindex/.test(robotsMeta),
    og: Object.fromEntries(['title', 'description', 'image', 'url'].map((k) => [k, decode(metaBy('property', `og:${k}`)[0] ?? '')])),
    twitterCard: decode(metaBy('name', 'twitter:card')[0] ?? ''),
    jsonLd, anchors, imgs, subresources, resources,
    lang: (html.match(/<html\b[^>]*\blang=["']([^"']+)["']/i) || [])[1] || '',
    viewport: metaBy('name', 'viewport').length > 0,
    ogImage: decode(metaBy('property', 'og:image')[0] ?? ''),
    pageIsHttps: pageUrl.startsWith('https://'),
  };
}

export async function crawlSite(siteKey, origin, opts = {}) {
  const o = { maxPages: 400, concurrency: 3, delayMs: 250, maxDepth: 8, timeoutMs: 15000, maxAssets: 600, probeUrls: [], allowedOrigins: [origin], ...opts };
  const host = new URL(origin).host;
  const fetchOrigin = o.fetchOrigin ? assertLoopbackOrigin(o.fetchOrigin) : null;
  const toLocal = (url) => {
    if (!fetchOrigin) return url;
    const u = new URL(url);
    if (u.origin !== new URL(origin).origin) throw new Error(`loopback mode only serves ${origin}: ${url}`);
    return fetchOrigin + u.pathname + u.search;
  };
  const fromLocal = (href) => (fetchOrigin && typeof href === 'string' && (href === fetchOrigin || href.startsWith(fetchOrigin + '/') || href.startsWith(fetchOrigin + '?')) ? origin + href.slice(fetchOrigin.length) : href);
  const findings = new Map();
  const add = (rule, url, detail = '', extra = {}) => {
    const [severity, cls] = RULES[rule];
    const key = `${siteKey}|${url}|${rule}|${detail}`;
    if (!findings.has(key)) findings.set(key, { site: siteKey, url, rule, severity, class_hint: cls, detail, ...extra });
  };
  const sameSite = (u) => { try { return new URL(u).host === host; } catch { return false; } };
  const inScope = (u) => { try { return o.allowedOrigins.includes(new URL(u).origin); } catch { return false; } };

  let active = 0; const waiters = [];
  const slot = async () => { if (active >= o.concurrency) await new Promise((r) => waiters.push(r)); active++; };
  const free = () => { active--; const w = waiters.shift(); if (w) w(); };

  /** One request, no redirect following. Only GET/HEAD, only in-scope origins. */
  async function once(method, url) {
    if (!inScope(url)) throw new Error(`out of scope: ${url}`);
    await slot();
    try {
      await sleep(o.delayMs);
      const res = await fetch(toLocal(url), { method, redirect: 'manual', headers: { 'user-agent': UA, accept: '*/*' }, signal: AbortSignal.timeout(o.timeoutMs) });
      const ctype = (res.headers.get('content-type') || '').toLowerCase();
      let text = '';
      if (method === 'GET' && /text\/html|xml|text\/plain/.test(ctype) && res.status < 300) {
        const len = Number(res.headers.get('content-length') || 0);
        text = len > 4_000_000 ? '' : await res.text();
      } else { try { await res.body?.cancel(); } catch { /* ignore */ } }
      return { status: res.status, headers: res.headers, ctype, text, location: fromLocal(res.headers.get('location')) };
    } finally { free(); }
  }

  /** Follow redirects by hand, recording the chain. */
  async function fetchChain(url, method = 'GET') {
    const chain = [];
    let cur = url; const seen = new Set();
    for (let hop = 0; hop < 10; hop++) {
      if (seen.has(cur)) return { chain, final: null, loop: true };
      seen.add(cur);
      let r;
      try { r = await once(method, cur); } catch (e) { return { chain, final: { status: 0, error: String(e.message || e), url: cur }, loop: false }; }
      if (method === 'HEAD' && [403, 405, 501].includes(r.status)) { try { r = await once('GET', cur); } catch { /* keep HEAD result */ } }
      if (r.status >= 300 && r.status < 400 && r.location) {
        const next = new URL(r.location, cur).toString();
        chain.push({ from: cur, status: r.status, to: next });
        if (!inScope(next)) return { chain, final: { status: r.status, url: cur, external: next }, loop: false };
        cur = next; continue;
      }
      return { chain, final: { ...r, url: cur }, loop: false };
    }
    return { chain, final: null, loop: true };
  }

  const norm = (href, base) => {
    try { const u = new URL(fromLocal(href), base); u.hash = ''; return u.toString(); } catch { return null; }
  };
  const pages = new Map();       // url -> record
  const inbound = new Map();     // url -> Set(source pages)
  const linkTargets = new Map(); // target url -> {sources:Set}
  const queue = [];
  const enqueue = (url, depth, via) => {
    if (!url || pages.has(url) || queue.some((q) => q.url === url)) return;
    const u = new URL(url);
    if (SKIP_PATH.test(u.pathname) || ASSET_EXT.test(u.pathname)) return;
    if (u.search) return; // query URLs are noted, never crawled
    queue.push({ url, depth, via });
  };

  const urlLog = new Map();      // every URL the crawl learns about: kinds + referrers
  const note = (url, kind, from) => {
    if (!url) return;
    const e = urlLog.get(url) || urlLog.set(url, { url, kinds: new Set(), referrers: new Set() }).get(url);
    e.kinds.add(kind); if (from) e.referrers.add(from);
  };
  const assetChecks = new Map(); // url -> { kind, pages:Set, status, headStatus } (images, files, scripts, stylesheets, icons...)
  let assetCapped = 0;
  const wantAsset = (url, kind, page) => {
    if (!url || !sameSite(url)) return;
    const e = assetChecks.get(url);
    if (e) { e.pages.add(page); if (kind === 'image') e.kind = 'image'; return; }
    if (assetChecks.size >= o.maxAssets) { assetCapped++; return; }
    assetChecks.set(url, { kind, pages: new Set([page]), status: null, headStatus: null });
  };

  // ── robots.txt and sitemap ───────────────────────────────────────────────────────────────────────────────────────────
  const robotsRes = await fetchChain(`${origin}/robots.txt`);
  let robotsTxt = ''; let robotsSitemaps = []; const disallows = [];
  if (!robotsRes.final || robotsRes.final.status !== 200) add('ROBOTS_MISSING', `${origin}/robots.txt`, String(robotsRes.final?.status ?? 'loop'));
  else {
    robotsTxt = robotsRes.final.text;
    let ua = false;
    for (const raw of robotsTxt.split(/\r?\n/)) {
      const line = raw.replace(/#.*/, '').trim(); const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/); if (!m) continue;
      const k = m[1].toLowerCase(); const v = m[2].trim();
      if (k === 'user-agent') ua = v === '*';
      else if (k === 'disallow' && ua && v) disallows.push(v);
      else if (k === 'sitemap') robotsSitemaps.push(v);
    }
    if (disallows.includes('/')) add('ROBOTS_DISALLOWS_ALL', `${origin}/robots.txt`, 'User-agent: * Disallow: /');
    if (!robotsSitemaps.length) add('ROBOTS_NO_SITEMAP', `${origin}/robots.txt`);
  }
  const sitemapUrl = robotsSitemaps.find((s) => sameSite(s)) || `${origin}/sitemap.xml`;
  const smRes = await fetchChain(sitemapUrl);
  const sitemapUrls = new Set();
  if (!smRes.final || smRes.final.status !== 200) add('SITEMAP_MISSING', sitemapUrl, String(smRes.final?.status ?? 'loop'));
  else {
    const locs = [...smRes.final.text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => decode(m[1]));
    for (const loc of locs) {
      if (/\.xml(\?|$)/i.test(loc) && sameSite(loc) && loc !== sitemapUrl) { // sitemap index
        const sub = await fetchChain(loc);
        if (sub.final?.status === 200) for (const m of sub.final.text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)) sitemapUrls.add(decode(m[1]));
      } else sitemapUrls.add(loc);
    }
  }

  // ── site-level protocol checks ────────────────────────────────────────────────────────────────────────────────────────
  if (!fetchOrigin && origin.startsWith('https://') && o.allowedOrigins.includes(origin)) {
    const httpOrigin = origin.replace('https://', 'http://');
    const prevAllowed = o.allowedOrigins; o.allowedOrigins = [...prevAllowed, httpOrigin];
    try {
      const r = await once('GET', `${httpOrigin}/`);
      const ok = r.status >= 300 && r.status < 400 && /^https:\/\//i.test(r.location || '');
      if (!ok) add('HTTP_NOT_REDIRECTED', `${httpOrigin}/`, `status ${r.status}`);
    } catch (e) { add('HTTP_NOT_REDIRECTED', `${httpOrigin}/`, `unreachable: ${String(e.message || e)}`); }
    finally { o.allowedOrigins = prevAllowed; }
  }

  // ── crawl ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
  enqueue(`${origin}/`, 0, 'seed');
  for (const u of sitemapUrls) if (sameSite(u)) { enqueue(norm(u, origin), null, 'sitemap'); note(norm(u, origin), 'sitemap'); }

  async function visit({ url, depth, via }) {
    const { chain, final, loop } = await fetchChain(url);
    const rec = { url, depth, via, chain, status: final?.status ?? 0, finalUrl: final?.url ?? url, indexable: false };
    pages.set(url, rec);
    if (loop) { add('REDIRECT_LOOP', url, chain.map((c) => c.to).join(' -> ')); return; }
    if (!final || final.status === 0) { add('FETCH_FAILED', url, final?.error || 'no response'); return; }
    if (final.external) { add('EXTERNAL_REDIRECT', url, final.external); return; }
    if (chain.length >= 3) add('REDIRECT_CHAIN', url, `${chain.length} hops`);
    if (final.status >= 400) { add('INTERNAL_URL_ERROR', url, `HTTP ${final.status}`); if (chain.length) add('REDIRECT_TO_ERROR', url, `HTTP ${final.status}`); return; }
    if (final.status !== 200 || !/html/.test(final.ctype)) return;
    // A redirecting URL is an alias of its target, not a second document: analyse the target once, under its own URL, so nothing is counted twice.
    if (chain.length) { rec.aliasOf = final.url; if (sameSite(final.url)) enqueue(norm(final.url, origin), depth === null ? null : depth + 1, url); return; }

    const a = analyseHtml(final.text, final.url);
    rec.a = a;
    const xr = (final.headers.get('x-robots-tag') || '').toLowerCase();
    rec.noindex = a.noindex || /noindex/.test(xr);
    if (/noindex/.test(xr)) add('XROBOTS_NOINDEX', url, xr);
    if (a.noindex) add('NOINDEX_PAGE', url, 'meta robots');
    rec.indexable = !rec.noindex;
    const pth = (() => { try { return new URL(final.url).pathname; } catch { return '/'; } })();
    rec.softNotFound = /\b(404|not found|page not found)\b/i.test(a.title + ' ' + (a.h1s[0] || '')) && pth !== '/';
    if (rec.softNotFound) add('SOFT_404', url, a.title || a.h1s[0]);

    // canonical
    if (a.canonicals.length > 1) add('CANONICAL_MULTIPLE', url, a.canonicals.join(' | '));
    if (!a.canonicals.length) { if (rec.indexable) add('CANONICAL_MISSING', url); }
    else rec.canonical = norm(a.canonicals[0], final.url);
    // metadata
    if (!a.title) add('TITLE_MISSING', url); else if (a.title.length < TITLE_MIN || a.title.length > TITLE_MAX) add('TITLE_LENGTH', url, `${a.title.length} chars`);
    if (!a.description) add('DESCRIPTION_MISSING', url); else if (a.description.length < DESC_MIN || a.description.length > DESC_MAX) add('DESCRIPTION_LENGTH', url, `${a.description.length} chars`);
    if (!a.h1s.length) add('H1_MISSING', url); else if (a.h1s.length > 1) add('H1_MULTIPLE', url, `${a.h1s.length} h1`);
    const ogMissing = ['title', 'description', 'image', 'url'].filter((k) => !a.og[k]);
    if (ogMissing.length) add('OG_INCOMPLETE', url, `missing og:${ogMissing.join(', og:')}`);
    if (!a.twitterCard) add('TWITTER_CARD_MISSING', url);
    if (!a.jsonLd.length) add('JSONLD_MISSING', url);
    for (const block of a.jsonLd) { try { JSON.parse(block); } catch (e) { add('JSONLD_INVALID', url, String(e.message).slice(0, 80)); } }
    const noAlt = a.imgs.filter((i) => i.alt === undefined).length;
    if (noAlt) add('IMG_ALT_MISSING', url, `${noAlt} image(s)`);
    if (!a.lang) add('LANG_MISSING', url);
    if (!a.viewport) add('VIEWPORT_MISSING', url);
    if (a.pageIsHttps) for (const s of a.subresources) if (/^http:\/\//i.test(s)) add('MIXED_CONTENT', url, s);

    // links
    for (const link of a.anchors) {
      const href = link.href.trim();
      if (/^(mailto:|tel:|sms:|javascript:|#)/i.test(href)) continue;
      const target = norm(href, final.url); if (!target || !sameSite(target)) continue;
      if (/^http:\/\//i.test(target) && new URL(final.url).protocol === 'https:') add('INSECURE_INTERNAL_LINK', url, target);
      const tu = new URL(target);
      note(target, 'link', url);
      if (RES_SKIP.test(tu.pathname) || SKIP_PATH.test(tu.pathname)) continue;
      if (tu.search) add('QUERY_URL_LINKED', url, target);
      // Links to files and to query-string URLs are not crawled as pages, but their status is checked once so a dead download or parameter URL cannot hide.
      if (ASSET_EXT.test(tu.pathname) || tu.search) { wantAsset(target, 'file', url); continue; }
      (inbound.get(target) || inbound.set(target, new Set()).get(target)).add(url);
      (linkTargets.get(target) || linkTargets.set(target, new Set()).get(target)).add(url);
      if (depth !== null && depth < o.maxDepth) enqueue(target, depth + 1, url);
    }
    // images, scripts, stylesheets, icons, preloads, alternates (checked after the crawl, once per URL)
    for (const img of a.imgs) {
      const src = img.src || (img.srcset || '').split(',')[0].trim().split(/\s+/)[0]; if (!src || src.startsWith('data:')) continue;
      const abs = norm(src, final.url); if (abs && sameSite(abs)) { wantAsset(abs, 'image', url); note(abs, 'image', url); }
    }
    if (a.ogImage) { const abs = norm(a.ogImage, final.url); if (abs && sameSite(abs)) { wantAsset(abs, 'image', url); note(abs, 'image', url); } }
    for (const r of a.resources) {
      if (!r || /^(data:|blob:|javascript:|mailto:|tel:|#)/i.test(r)) continue;
      const abs = norm(r, final.url); if (!abs || !sameSite(abs)) continue;
      if (RES_SKIP.test(new URL(abs).pathname)) continue;
      wantAsset(abs, 'resource', url); note(abs, 'resource', url);
    }
  }

  let visited = 0;
  while (queue.length && visited < o.maxPages) {
    const batch = queue.splice(0, o.concurrency);
    await Promise.all(batch.map((q) => { visited++; return visit(q); }));
  }
  if (queue.length) add('FETCH_FAILED', origin, `crawl stopped at --max-pages ${o.maxPages} with ${queue.length} URL(s) unqueued`);

  // ── assets: images, files, scripts, stylesheets... ───────────────────────────────────────────────────────────────────
  // HEAD first (cheap). Anything that fails is confirmed with a GET before it is reported, so a server that refuses HEAD is a NOTICE, never an ERROR.
  async function checkAsset(assetUrl) {
    const h = await fetchChain(assetUrl, 'HEAD');
    const headStatus = h.loop ? 0 : (h.final?.status ?? 0);
    if (!h.loop && headStatus > 0 && headStatus < 400) return { status: headStatus, headStatus, loop: false };
    const g = await fetchChain(assetUrl, 'GET');
    const status = g.loop ? 0 : (g.final?.status ?? 0);
    return { status, headStatus, loop: g.loop, mismatch: !g.loop && status > 0 && status < 400 };
  }
  await Promise.all([...assetChecks.entries()].map(async ([assetUrl, rec]) => {
    const r = await checkAsset(assetUrl);
    rec.status = r.status; rec.headStatus = r.headStatus;
    const rule = rec.kind === 'image' ? 'BROKEN_IMAGE' : rec.kind === 'file' ? 'BROKEN_FILE_LINK' : 'BROKEN_RESOURCE';
    if (r.mismatch) for (const p of rec.pages) add('HEAD_GET_MISMATCH', p, `${assetUrl} HEAD ${r.headStatus || 'failed'}, GET ${r.status}`);
    else if (r.loop || r.status === 0 || r.status >= 400) for (const p of rec.pages) add(rule, p, `${assetUrl} -> ${r.loop ? 'redirect loop' : (r.status || 'unreachable')} (HEAD ${r.headStatus || 'failed'}, GET confirmed)`);
  }));
  if (assetCapped) add('FETCH_FAILED', origin, `${assetCapped} asset URL(s) not checked: --max-assets cap of ${o.maxAssets} reached`);
  const imageCount = [...assetChecks.values()].filter((e) => e.kind === 'image').length;

  // ── cross-page reconciliation ─────────────────────────────────────────────────────────────────────────────────────────
  for (const [target, sources] of linkTargets) {
    const rec = pages.get(target); if (!rec) continue;
    if (rec.chain.length && rec.status < 400 && rec.status !== 0) for (const s of sources) add('INTERNAL_LINK_REDIRECTS', s, `${target} -> ${rec.finalUrl}`);
    if (rec.status >= 400 || rec.softNotFound) for (const s of sources) add('BROKEN_INTERNAL_LINK', s, `${target} (${rec.softNotFound ? 'soft 404' : 'HTTP ' + rec.status})`);
  }
  const titles = new Map(); const descs = new Map();
  for (const rec of pages.values()) {
    if (!rec.a || !rec.indexable) continue;
    if (rec.a.title) (titles.get(rec.a.title) || titles.set(rec.a.title, []).get(rec.a.title)).push(rec.url);
    if (rec.a.description) (descs.get(rec.a.description) || descs.set(rec.a.description, []).get(rec.a.description)).push(rec.url);
    if (rec.canonical && rec.canonical !== rec.finalUrl && rec.canonical.replace(/\/$/, '') !== rec.finalUrl.replace(/\/$/, '')) {
      const tgt = pages.get(rec.canonical);
      if (tgt && (tgt.status >= 400 || tgt.chain.length)) add('CANONICAL_TARGET_BAD', rec.url, `${rec.canonical} -> ${tgt.chain.length ? 'redirects to ' + tgt.finalUrl : 'HTTP ' + tgt.status}`);
      else add('CANONICAL_MISMATCH', rec.url, rec.canonical);
    } else if (rec.canonical && rec.canonical !== rec.finalUrl) add('CANONICAL_MISMATCH', rec.url, `${rec.canonical} (trailing slash differs)`);
    if (rec.canonical) note(rec.canonical, 'canonical', rec.canonical === rec.url || rec.canonical === rec.finalUrl ? null : rec.url); // a self-canonical is not an inbound reference
    if (rec.canonical && !pages.has(rec.canonical) && sameSite(rec.canonical) && !SKIP_PATH.test(new URL(rec.canonical).pathname)) {
      // a canonical we never reached: verify it directly so canonical-to-404 cannot hide
      const r = await fetchChain(rec.canonical);
      if (!r.final || r.final.status >= 400 || r.final.status === 0) add('CANONICAL_TARGET_BAD', rec.url, `${rec.canonical} -> HTTP ${r.final?.status ?? 'loop'}`);
      else if (r.chain.length) add('CANONICAL_TARGET_BAD', rec.url, `${rec.canonical} -> redirects to ${r.final.url}`);
    }
    if (rec.depth !== null && rec.depth > 5) add('DEEP_PAGE', rec.url, `depth ${rec.depth}`);
  }
  for (const [t, urls] of titles) if (urls.length > 1) for (const u of urls) add('TITLE_DUPLICATE', u, `"${t.slice(0, 70)}" on ${urls.length} pages`);
  for (const [d, urls] of descs) if (urls.length > 1) for (const u of urls) add('DESCRIPTION_DUPLICATE', u, `"${d.slice(0, 70)}" on ${urls.length} pages`);

  // sitemap reconciliation
  const sitemapNorm = new Set([...sitemapUrls].map((u) => norm(u, origin)));
  for (const u of sitemapNorm) {
    if (!sameSite(u)) continue;
    const rec = pages.get(u); if (!rec) continue;
    if (rec.status >= 400 || rec.status === 0) add('SITEMAP_URL_NOT_200', u, `HTTP ${rec.status}`);
    else if (rec.chain.length) add('SITEMAP_URL_REDIRECTS', u, `-> ${rec.finalUrl}`);
    else if (rec.noindex) add('NOINDEX_IN_SITEMAP', u);
    else if (rec.canonical && rec.canonical !== u) add('SITEMAP_URL_NON_CANONICAL', u, `canonical ${rec.canonical}`);
    if (disallows.some((d) => d !== '/' && new URL(u).pathname.startsWith(d))) add('ROBOTS_BLOCKS_SITEMAP_URL', u, 'blocked by robots.txt Disallow');
    if (!(inbound.get(u)?.size) && new URL(u).pathname !== '/') add('ORPHAN_PAGE', u, 'in the sitemap, linked from no crawled page');
  }
  if (sitemapNorm.size) for (const rec of pages.values()) {
    if (rec.a && rec.indexable && rec.status === 200 && !rec.chain.length && !rec.softNotFound && !sitemapNorm.has(rec.url)) add('INDEXABLE_NOT_IN_SITEMAP', rec.url);
  }

  // ── probe: externally reported URLs, requested directly and compared with what this crawl discovered ──────────────────────
  const probes = [];
  for (const raw of (o.probeUrls || []).slice(0, 500)) {
    const u = norm(raw, origin);
    if (!u || !inScope(u)) { probes.push({ input: raw, refused: 'not on the audited host' }); continue; }
    if (RES_SKIP.test(new URL(u).pathname)) { probes.push({ input: raw, url: u, refused: 'excluded path (api/admin)' }); continue; }
    const known = urlLog.get(u) || (pages.has(u) ? { kinds: new Set(['page']), referrers: new Set() } : null);
    const r = await fetchChain(u, 'GET');
    probes.push({
      input: raw, url: u, status: r.loop ? 'redirect loop' : (r.final?.status ?? 0), final_url: r.final?.url || null, redirect_hops: r.chain.length,
      discovered_by_crawl: Boolean(known), kinds: known ? [...known.kinds] : [], referrers_count: known ? known.referrers.size : 0, referrers: known ? [...known.referrers].slice(0, 25) : [],
    });
  }

  // referrers on page-level errors, so a by-URL comparison shows who links to a dead page
  const referrersOf = (u) => [...(inbound.get(u) || urlLog.get(u)?.referrers || [])].slice(0, 25);
  const list = [...findings.values()].map((f) => (f.rule === 'INTERNAL_URL_ERROR' ? { ...f, referrers: referrersOf(f.url) } : f));
  const statusOf = (u) => pages.get(u)?.status ?? assetChecks.get(u)?.status ?? null;
  const urls = [...urlLog.values()].map((e) => ({
    url: e.url, kinds: [...e.kinds].sort(), status: statusOf(e.url), final_url: pages.get(e.url)?.finalUrl && pages.get(e.url).finalUrl !== e.url ? pages.get(e.url).finalUrl : null,
    referrers_count: e.referrers.size, referrers: [...e.referrers].slice(0, 25),
  })).sort((x, y) => x.url.localeCompare(y.url));
  const summary = {
    site: siteKey, origin, mode: fetchOrigin ? 'loopback' : 'live', fetch_origin: fetchOrigin, pages_crawled: pages.size, urls_discovered: urls.length, sitemap_urls: sitemapNorm.size, images_checked: imageCount, assets_checked: assetChecks.size,
    sitemap_url: sitemapUrl, robots_ok: Boolean(robotsTxt), probes: probes.length,
    by_severity: Object.fromEntries(['ERROR', 'WARNING', 'NOTICE'].map((s2) => [s2, list.filter((f) => f.severity === s2).length])),
    by_rule: Object.fromEntries(Object.entries(list.reduce((m, f) => (m[f.rule] = (m[f.rule] || 0) + 1, m), {})).sort((x, y) => y[1] - x[1])),
    status_histogram: [...pages.values()].reduce((m, p) => (m[p.status] = (m[p.status] || 0) + 1, m), {}),
    reachable: pages.size > 0 && [...pages.values()].some((p) => p.status > 0),
  };
  return { summary, findings: list, urls, probes };
}

/** One externally reported URL per line; a CSV works (first field). Lines that are not an absolute URL or a /path, comments and duplicates are dropped. */
export const BASELINE_MAX_DAYS = 90;

/** Parse and validate a baseline file for one site. Returns { entries, errors }; any error means the file must not be used. */
export function loadBaseline(text, siteKey, now = new Date()) {
  const errors = []; let doc;
  try { doc = JSON.parse(text); } catch (e) { return { entries: [], errors: [`baseline is not valid JSON: ${e.message}`] }; }
  if (!doc || doc.version !== 1) errors.push('baseline.version must be 1');
  if (!doc || doc.site !== siteKey) errors.push(`baseline.site must be "${siteKey}"`);
  if (!doc || !Array.isArray(doc.entries)) { errors.push('baseline.entries must be an array'); return { entries: [], errors }; }
  const horizon = new Date(now.getTime() + BASELINE_MAX_DAYS * 86_400_000).toISOString().slice(0, 10);
  const entries = doc.entries.map((e, i) => {
    const at = `entries[${i}]`;
    if (!e || typeof e !== 'object') { errors.push(`${at} is not an object`); return null; }
    if (!RULES[e.rule]) errors.push(`${at}.rule "${e.rule}" is not a crawler rule`);
    if (typeof e.path !== 'string' || !e.path.startsWith('/')) errors.push(`${at}.path must be a site path starting with "/"`);
    for (const k of ['reason', 'owner']) if (typeof e[k] !== 'string' || !e[k].trim()) errors.push(`${at}.${k} is required`);
    if (typeof e.expires !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(e.expires) || Number.isNaN(Date.parse(e.expires))) errors.push(`${at}.expires must be YYYY-MM-DD`);
    else if (e.expires > horizon) errors.push(`${at}.expires ${e.expires} is more than ${BASELINE_MAX_DAYS} days ahead (latest allowed ${horizon})`);
    if (e.detail_includes !== undefined && typeof e.detail_includes !== 'string') errors.push(`${at}.detail_includes must be a string`);
    return e;
  }).filter(Boolean);
  return { entries, errors };
}

/** Only ERROR-class findings gate. An unexpired matching entry accepts a finding; an expired one does not. Unmatched entries are reported as removable. */
export function applyBaseline(findings, entries, now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  const pathOf = (u) => { try { const x = new URL(u); return x.pathname + x.search; } catch { return u; } };
  const matched = new Set(); const newErrors = []; const baselined = [];
  for (const f of findings) {
    if (f.severity !== 'ERROR') continue;
    const p = pathOf(f.url);
    const e = entries.find((x) => x.rule === f.rule && x.path === p && (!x.detail_includes || String(f.detail).includes(x.detail_includes)));
    if (!e) { newErrors.push({ ...f, why: 'not in baseline' }); continue; }
    matched.add(e);
    if (e.expires < today) newErrors.push({ ...f, why: `baseline entry expired ${e.expires}` }); else baselined.push(f);
  }
  const removable = entries.filter((e) => !matched.has(e)).map((e) => ({ rule: e.rule, path: e.path, expires: e.expires }));
  return { ok: newErrors.length === 0, new_errors: newErrors, baselined: baselined.length, removable };
}

export function parseProbeList(text) {
  return [...new Set(String(text).split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
    .map((l) => l.split(/[\s,;]+/)[0].replace(/^["']|["']$/g, '')).filter((v) => /^https?:\/\//i.test(v) || v.startsWith('/')))].slice(0, 500);
}

/**
 * Route an external URL list to the sites being crawled. A bare /path goes to the (single) selected site; an absolute URL goes to the site whose host it matches.
 * Anything that matches none of the selected sites is returned as `unrouted` so the report can say so: an entry is never silently dropped.
 */
export function routeProbes(list, siteKeys) {
  const hostOf = (v) => { try { return new URL(v).host; } catch { return ''; } };
  const bySite = Object.fromEntries(siteKeys.map((k) => [k, []]));
  const unrouted = [];
  for (const v of list) {
    if (v.startsWith('/')) { for (const k of siteKeys) bySite[k].push(v); continue; }
    const k = siteKeys.find((key) => hostOf(SITES[key]) === hostOf(v));
    if (k) bySite[k].push(v); else unrouted.push(v);
  }
  return { bySite, unrouted };
}

function register(results, unrouted = [], gates = []) {
  const lines = ['# Technical SEO crawl register', '', `Generated ${new Date().toISOString()} by technical-seo-crawl.mjs (read-only; GET/HEAD only; no JavaScript execution).`, ''];
  lines.push('| SITE | PAGES | URLS SEEN | SITEMAP URLS | ASSETS CHECKED | ERROR | WARNING | NOTICE |', '|---|---|---|---|---|---|---|---|');
  for (const r of results) lines.push(`| ${r.summary.site} | ${r.summary.pages_crawled} | ${r.summary.urls_discovered} | ${r.summary.sitemap_urls} | ${r.summary.assets_checked} | ${r.summary.by_severity.ERROR} | ${r.summary.by_severity.WARNING} | ${r.summary.by_severity.NOTICE} |`);
  for (const r of results) {
    lines.push('', `## ${r.summary.site} (${r.summary.origin})`, '', `Status histogram: ${JSON.stringify(r.summary.status_histogram)}`, '', '| RULE | SEVERITY | CLASS HINT | COUNT |', '|---|---|---|---|');
    for (const [rule, n] of Object.entries(r.summary.by_rule)) lines.push(`| ${rule} | ${RULES[rule][0]} | ${RULES[rule][1]} | ${n} |`);
    const errs = r.findings.filter((f) => f.severity === 'ERROR');
    if (errs.length) {
      lines.push('', '### Errors', '', '| RULE | URL | DETAIL |', '|---|---|---|');
      for (const f of errs.slice(0, 80)) lines.push(`| ${f.rule} | ${f.url.replace(/\|/g, '%7C')} | ${String(f.detail).replace(/\|/g, '/').slice(0, 400)} |`);
      if (errs.length > 80) lines.push(`| … | ${errs.length - 80} more in register.json | |`);
    }
    if (r.probes.length) {
      lines.push('', '### Probe of externally reported URLs', '', '| URL | LIVE STATUS | FOUND BY THIS CRAWL | LINKED FROM |', '|---|---|---|---|');
      for (const q of r.probes) {
        if (q.refused) { lines.push(`| ${String(q.input).replace(/\|/g, '%7C')} | refused: ${q.refused} | — | — |`); continue; }
        lines.push(`| ${q.url.replace(/\|/g, '%7C')} | ${q.status}${q.redirect_hops ? ` (via ${q.redirect_hops} redirect(s) to ${q.final_url})` : ''} | ${q.discovered_by_crawl ? 'yes (' + q.kinds.join(', ') + ')' : 'NO'} | ${q.referrers_count ? q.referrers.slice(0, 3).join(', ') + (q.referrers_count > 3 ? ` +${q.referrers_count - 3}` : '') : '—'} |`);
      }
    }
  }
  for (const g of gates) {
    lines.push('', `## Gate: ${g.site} (${g.mode}) — ${g.ok ? 'PASS' : 'FAIL'}`, '', `Engine ${g.engine}. New ERROR findings: ${g.new_errors.length}; accepted by baseline: ${g.baselined}; removable baseline entries: ${g.removable.length}.`);
    if (g.new_errors.length) { lines.push('', '| RULE | URL | WHY | DETAIL |', '|---|---|---|---|'); for (const f of g.new_errors.slice(0, 80)) lines.push(`| ${f.rule} | ${f.url} | ${f.why} | ${String(f.detail).replace(/\|/g, '%7C').slice(0, 140)} |`); }
    if (g.removable.length) { lines.push('', 'Removable (no longer reproduces):', ''); for (const r of g.removable) lines.push(`- ${r.rule} ${r.path} (expires ${r.expires})`); }
  }
  if (unrouted.length) {
    lines.push('', '## Probe entries not routed to any crawled site', '', 'These were in the probe list but their host is not one of the sites crawled in this run, so they were NOT requested.', '', '| ENTRY |', '|---|');
    for (const v of unrouted) lines.push(`| ${String(v).replace(/\|/g, '%7C')} |`);
  }
  return lines.join('\n') + '\n';
}

async function main() {
  const args = process.argv.slice(2);
  const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
  const site = opt('site', '');
  const keys = site === 'all' ? Object.keys(SITES) : [site];
  if (!keys.every((k) => SITES[k])) { console.error(`--site must be one of ${Object.keys(SITES).join(', ')}, all`); process.exit(2); }
  const num = (n, d, lo, hi) => { const v = Number(opt(n, d)); if (!Number.isFinite(v) || v < lo || v > hi) { console.error(`--${n} must be ${lo}..${hi}`); process.exit(2); } return v; };
  const maxPages = num('max-pages', 400, 1, 1000); const concurrency = num('concurrency', 3, 1, 8); const delayMs = num('delay-ms', 250, 50, 5000); const maxDepth = num('max-depth', 8, 1, 12);
  const out = opt('out', 'technical-seo-crawl-out');
  const failOnNew = args.includes('--fail-on-new-errors');
  const originArg = opt('origin', ''); const baselineArg = opt('baseline', '');
  if ((originArg || baselineArg) && (site === 'all' || keys.length !== 1)) { console.error('--origin and --baseline need a single --site'); process.exit(2); }
  let fetchOrigin = null; let baseline = { entries: [], errors: [] };
  if (originArg) { try { fetchOrigin = assertLoopbackOrigin(originArg); } catch (e) { console.error(e.message); process.exit(2); } }
  if (baselineArg) {
    let text; try { text = fs.readFileSync(baselineArg, 'utf8'); } catch (e) { console.error(`cannot read --baseline: ${e.message}`); process.exit(2); }
    baseline = loadBaseline(text, keys[0]);
    if (baseline.errors.length) { console.error(`baseline ${baselineArg} is invalid:\n  - ${baseline.errors.join('\n  - ')}`); process.exit(2); }
  }
  fs.mkdirSync(out, { recursive: true });
  const engine = engineHash();
  // --probe-file: one externally reported URL per line (a CSV works: the first field is used). Absolute URLs go to their own site; a bare path needs a single --site.
  const probeFile = opt('probe-file', '');
  let probeAll = [];
  if (probeFile) {
    probeAll = parseProbeList(fs.readFileSync(probeFile, 'utf8'));
    if (probeAll.some((v) => v.startsWith('/')) && keys.length !== 1) { console.error('--probe-file with bare paths needs a single --site'); process.exit(2); }
  }
  const routed = routeProbes(probeAll, keys);
  if (routed.unrouted.length) console.warn(`${routed.unrouted.length} probe entr${routed.unrouted.length === 1 ? 'y' : 'ies'} not on any crawled site: not requested, listed in the register`);
  const results = [];
  for (const k of keys) {
    console.log(`crawling ${k} (${SITES[k]})${fetchOrigin ? ` via loopback ${fetchOrigin}` : ''}, engine ${engine}`);
    const probeUrls = routed.bySite[k];
    const r = await crawlSite(k, SITES[k], { maxPages, concurrency, delayMs, maxDepth, probeUrls, fetchOrigin });
    r.summary.engine = engine;
    fs.writeFileSync(path.join(out, `${k}.findings.json`), JSON.stringify(r, null, 2));
    console.log(`  ${r.summary.pages_crawled} pages, ${r.summary.urls_discovered} URLs seen, ${r.summary.assets_checked} assets checked: ${JSON.stringify(r.summary.by_severity)}`);
    results.push(r);
  }
  const gates = (baselineArg || failOnNew) ? results.map((r) => ({ site: r.summary.site, mode: r.summary.mode, engine, ...applyBaseline(r.findings, baseline.entries) })) : [];
  if (gates.length) {
    fs.writeFileSync(path.join(out, 'gate.json'), JSON.stringify(gates, null, 2));
    for (const g of gates) console.log(`gate ${g.site}: ${g.ok ? 'PASS' : 'FAIL'} (${g.new_errors.length} new ERROR, ${g.baselined} baselined, ${g.removable.length} removable baseline entries)`);
  }
  fs.writeFileSync(path.join(out, 'register.json'), JSON.stringify({ generated: new Date().toISOString(), engine, gates, sites: results.map((r) => r.summary), findings: results.flatMap((r) => r.findings), unrouted_probes: routed.unrouted }, null, 2));
  fs.writeFileSync(path.join(out, 'register.md'), register(results, routed.unrouted, gates));
  if (results.some((r) => !r.summary.reachable)) process.exit(3);
  process.exit(failOnNew && gates.some((g) => !g.ok) ? 1 : 0);
}

if (process.argv[1] && import.meta.url === new URL(`file://${path.resolve(process.argv[1])}`).href) main().catch((e) => { console.error(e); process.exit(3); });
