// TECHNICAL-SEO-C5-FRAMEWORK-ENGINE-01 (netyvee/app#344): copied unchanged from netyvee/app tests/ci/technical-seo-crawl.test.mjs (vitest instead of node:test; the CRM-gate assertion is dropped).
// TECHNICAL-SEO-ASSURANCE-01 (#344): the crawler must find each representative defect on a local fixture site, find none on a clean page, and never
// write. Runs with `node --test tests/ci/technical-seo-crawl.test.mjs`; no network beyond 127.0.0.1.
import { test, beforeAll, afterAll } from 'vitest';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { crawlSite, analyseHtml, parseProbeList, routeProbes, assertLoopbackOrigin, loadBaseline, applyBaseline, engineHash, THRESHOLDS, RULES, SITES } from '../scripts/seo-crawl/technical-seo-crawl.mjs';

const GOOD_HEAD = (p, extra = '') => `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Fixture page ${p} for the technical SEO crawl</title><meta name="description" content="Fixture page ${p}: used to prove the crawler finds what it should find and nothing else, written to be a sensible length.">
<link rel="canonical" href="ORIGIN${p}"><meta property="og:title" content="t"><meta property="og:description" content="d"><meta property="og:image" content="ORIGIN/img/ok.png"><meta property="og:url" content="ORIGIN${p}">
<meta name="twitter:card" content="summary"><script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"x"}</script>${extra}</head>`;
const page = (p, body, extra = '') => GOOD_HEAD(p, extra) + `<body><h1>Heading ${p}</h1>${body}</body></html>`;

const requests = [];
function makeServer(canon = null) {
  return http.createServer((req, res) => {
    requests.push(`${req.method} ${req.url}`);
    const o = canon || `http://127.0.0.1:${req.socket.localPort}`;
    const send = (code, type, body, headers = {}) => { res.writeHead(code, { 'content-type': type, ...headers }); res.end(body.replaceAll('ORIGIN', o)); };
    const html = (s) => send(200, 'text/html', s);
    switch (req.url) {
      case '/': return html(page('/', '<a href="/ok">ok</a><a href="/a">a</a><a href="/b">b</a><a href="/c">c</a><a href="/missing">gone</a><a href="/redir">r</a><a href="/soft">soft</a><img src="/img/ok.png" alt="ok"><img src="/img/bad.png" alt="bad"><img src="/img/headonly.png" alt="h"><a href="/page?utm=1">q</a><a href="/files/missing.pdf">pdf</a><a href="/files/ok.pdf">pdf</a>', '<link rel="stylesheet" href="/css/missing.css"><script src="/js/ok.js"></script>'));
      case '/ok': return html(page('/ok', '<p>fine</p>'));
      case '/a': return html(GOOD_HEAD('/a').replace(/ORIGIN\/a"/, 'ORIGIN/nowhere"').replace(/<meta name="description"[^>]*>/, '').replace('<title>Fixture page /a for the technical SEO crawl</title>', '<title>Same title on two pages for the crawl test</title>').replace('{"@context"', '{"@context" BROKEN') + '<body><h1>One</h1><h1>Two</h1><img src="/img/ok.png"><a href="/ok">ok</a></body></html>');
      case '/b': return html(GOOD_HEAD('/b', '<meta name="robots" content="noindex,follow">') + '<body><h1>B</h1></body></html>');
      case '/c': return html(page('/c', '<p>c</p>').replace('Fixture page /c for the technical SEO crawl', 'Same title on two pages for the crawl test'));
      case '/soft': return html(page('/soft', '').replace('Fixture page /soft for the technical SEO crawl', 'Page not found - fixture'));
      case '/redir': return send(301, 'text/plain', '', { location: '/ok' });
      case '/loop1': return send(302, 'text/plain', '', { location: '/loop2' });
      case '/loop2': return send(302, 'text/plain', '', { location: '/loop1' });
      case '/orphan': return html(page('/orphan', '<p>nobody links here</p>'));
      case '/img/ok.png': return send(200, 'image/png', 'png');
      case '/img/headonly.png': return req.method === 'HEAD' ? send(404, 'text/plain', '') : send(200, 'image/png', 'png');
      case '/files/ok.pdf': return send(200, 'application/pdf', 'pdf');
      case '/js/ok.js': return send(200, 'application/javascript', 'x');
      case '/robots.txt': return send(200, 'text/plain', 'User-agent: *\nDisallow: /private\nDisallow: /orphan\nSitemap: ORIGIN/sitemap.xml\n');
      case '/sitemap.xml': return send(200, 'application/xml', `<urlset><url><loc>ORIGIN/</loc></url><url><loc>ORIGIN/ok</loc></url><url><loc>ORIGIN/a</loc></url><url><loc>ORIGIN/b</loc></url><url><loc>ORIGIN/c</loc></url>
        <url><loc>ORIGIN/redir</loc></url><url><loc>ORIGIN/nonexistent</loc></url><url><loc>ORIGIN/orphan</loc></url><url><loc>ORIGIN/loop1</loc></url></urlset>`);
      default: return send(404, 'text/html', '<html><head><title>Not Found</title></head><body>no</body></html>');
    }
  });
}
let server; let result;
beforeAll(async () => {
  server = makeServer(); await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const origin = `http://127.0.0.1:${server.address().port}`;
  result = await crawlSite('fixture', origin, { delayMs: 0, concurrency: 3, allowedOrigins: [origin] });
});
afterAll(() => server.close());

const has = (rule, urlPart, detailPart = '') => result.findings.some((f) => f.rule === rule && f.url.includes(urlPart) && f.detail.includes(detailPart));

test('finds the representative defects', () => {
  assert.ok(has('INTERNAL_URL_ERROR', '/missing', '404'), 'a linked 404');
  assert.ok(has('BROKEN_INTERNAL_LINK', '127.0.0.1', '/missing'), 'a page linking to the 404');
  assert.ok(has('BROKEN_IMAGE', '127.0.0.1', '/img/bad.png'), 'a broken image');
  assert.ok(has('CANONICAL_TARGET_BAD', '/a', '/nowhere'), 'canonical pointing at a 404');
  assert.ok(has('NOINDEX_IN_SITEMAP', '/b'), 'noindex page listed in the sitemap');
  assert.ok(has('SITEMAP_URL_NOT_200', '/nonexistent'), 'sitemap URL that 404s');
  assert.ok(has('SITEMAP_URL_REDIRECTS', '/redir'), 'sitemap URL that redirects');
  assert.ok(has('INDEXABLE_NOT_IN_SITEMAP', '/soft') === false, 'a soft 404 is not "indexable but missing from the sitemap"');
  assert.ok(has('SOFT_404', '/soft'), 'a 200 that says not found');
  assert.ok(has('REDIRECT_LOOP', '/loop1'), 'a redirect loop');
  assert.ok(has('ROBOTS_BLOCKS_SITEMAP_URL', '/orphan'), 'robots disallows a sitemap URL');
  assert.ok(has('ORPHAN_PAGE', '/orphan'), 'a sitemap URL no page links to');
  assert.ok(has('TITLE_DUPLICATE', '/a') && has('TITLE_DUPLICATE', '/c'), 'duplicate titles');
  assert.ok(has('DESCRIPTION_MISSING', '/a'), 'missing description');
  assert.ok(has('H1_MULTIPLE', '/a'), 'two h1s');
  assert.ok(has('JSONLD_INVALID', '/a'), 'invalid JSON-LD');
  assert.ok(has('IMG_ALT_MISSING', '/a'), 'image without alt');
  assert.ok(has('QUERY_URL_LINKED', '127.0.0.1', 'utm=1'), 'a parameter URL linked internally');
  assert.ok(has('INTERNAL_LINK_REDIRECTS', '127.0.0.1', '/redir'), 'an internal link that redirects');
});

test('v2: a dead file link, a dead query link and a dead stylesheet are found; a live file and script are not', () => {
  assert.ok(has('BROKEN_FILE_LINK', '127.0.0.1', '/files/missing.pdf'), 'a link to a missing file');
  assert.ok(has('BROKEN_FILE_LINK', '127.0.0.1', '/page?utm=1'), 'a link to a query-string URL that 404s');
  assert.ok(has('BROKEN_RESOURCE', '127.0.0.1', '/css/missing.css'), 'a missing stylesheet');
  assert.ok(!result.findings.some((f) => f.detail.includes('/files/ok.pdf') || f.detail.includes('/js/ok.js')), 'live assets are not flagged');
});

test('v2: a URL that only fails HEAD is confirmed with GET and reported as a NOTICE, never an ERROR', () => {
  assert.ok(has('HEAD_GET_MISMATCH', '127.0.0.1', '/img/headonly.png'));
  assert.ok(!result.findings.some((f) => f.rule === 'BROKEN_IMAGE' && f.detail.includes('headonly')), 'not reported as a broken image');
  const bad = result.findings.find((f) => f.rule === 'BROKEN_IMAGE' && f.detail.includes('/img/bad.png'));
  assert.ok(bad && bad.detail.includes('GET confirmed'), 'a genuinely broken image says it was confirmed with GET');
});

test('v2: every discovered URL is logged with its kinds and referrers, and a dead page names who links to it', () => {
  const origin = result.summary.origin;
  const byUrl = Object.fromEntries(result.urls.map((u) => [u.url, u]));
  assert.deepEqual(byUrl[`${origin}/files/missing.pdf`].kinds, ['link']);
  assert.equal(byUrl[`${origin}/files/missing.pdf`].status, 404);
  assert.ok(byUrl[`${origin}/files/missing.pdf`].referrers.includes(`${origin}/`));
  assert.ok(byUrl[`${origin}/css/missing.css`].kinds.includes('resource'));
  assert.ok(byUrl[`${origin}/orphan`].kinds.includes('sitemap') && byUrl[`${origin}/orphan`].referrers_count === 0);
  const dead = result.findings.find((f) => f.rule === 'INTERNAL_URL_ERROR' && f.url.endsWith('/missing'));
  assert.ok(dead.referrers.includes(`${origin}/`), 'the 404 finding lists its referrers');
  assert.equal(result.summary.urls_discovered, result.urls.length);
});

test('v2: --probe-file style probing reports live status and whether the crawl found each URL, and refuses off-host and api paths', async () => {
  const origin = `http://127.0.0.1:${server.address().port}`;
  const r = await crawlSite('fixture', origin, { delayMs: 0, allowedOrigins: [origin], probeUrls: ['/missing', '/ok', '/never-linked', 'http://evil.example/x', '/api/x', `${origin}/files/missing.pdf`] });
  const by = Object.fromEntries(r.probes.map((q) => [q.input, q]));
  assert.equal(by['/missing'].status, 404); assert.equal(by['/missing'].discovered_by_crawl, true); assert.ok(by['/missing'].referrers_count >= 1);
  assert.equal(by['/ok'].status, 200); assert.equal(by['/ok'].discovered_by_crawl, true);
  assert.equal(by['/never-linked'].status, 404); assert.equal(by['/never-linked'].discovered_by_crawl, false, 'a URL the crawl never saw is reported as NOT found');
  assert.ok(by['http://evil.example/x'].refused && !by['http://evil.example/x'].status, 'off-host refused, never requested');
  assert.ok(by['/api/x'].refused, 'api paths are refused');
  assert.equal(by[`${origin}/files/missing.pdf`].status, 404); assert.equal(by[`${origin}/files/missing.pdf`].discovered_by_crawl, true);
  assert.equal(r.summary.probes, 6);
});

test('a clean page produces no ERROR and no WARNING', () => {
  const bad = result.findings.filter((f) => f.url.endsWith('/ok') && f.severity !== 'NOTICE');
  assert.deepEqual(bad.map((f) => f.rule), [], 'the clean /ok page must not be flagged');
});

test('it only ever sends GET and HEAD', () => {
  assert.ok(requests.length > 10);
  assert.deepEqual([...new Set(requests.map((r) => r.split(' ')[0]))].sort(), ['GET', 'HEAD']);
});

test('every finding names a known rule with a severity and a class hint', () => {
  for (const f of result.findings) {
    assert.ok(RULES[f.rule], f.rule);
    assert.ok(['ERROR', 'WARNING', 'NOTICE'].includes(f.severity));
    assert.ok(['CODE', 'CONTENT', 'CONFIG', 'DEPLOYMENT', 'EXTERNAL'].includes(f.class_hint));
  }
  assert.equal(new Set(result.findings.map((f) => `${f.url}|${f.rule}|${f.detail}`)).size, result.findings.length, 'de-duplicated');
});

test('it refuses to leave the audited origin', async () => {
  const other = http.createServer((_q, s) => { s.writeHead(302, { location: 'http://127.0.0.1:1/x' }); s.end(); });
  await new Promise((r) => other.listen(0, '127.0.0.1', r));
  const origin = `http://127.0.0.1:${other.address().port}`;
  const r = await crawlSite('x', origin, { delayMs: 0, allowedOrigins: [origin] });
  other.close();
  assert.ok(r.findings.some((f) => f.rule === 'EXTERNAL_REDIRECT'), 'an off-host redirect is recorded, not followed');
});

test('analyseHtml reads a page as a crawler would and flags http:// resources on an https page', () => {
  const a = analyseHtml('<html lang="en"><head><title> T </title><link rel="canonical" href="/x"><meta name="robots" content="NOINDEX"></head><body><h1>H</h1><img src="http://cdn.example/a.png"></body></html>', 'https://example.test/x');
  assert.equal(a.title, 'T'); assert.equal(a.noindex, true); assert.deepEqual(a.canonicals, ['/x']); assert.ok(a.subresources.includes('http://cdn.example/a.png')); assert.equal(a.pageIsHttps, true);
});

test('the production allow-list is exactly the five public hosts', () => {
  assert.deepEqual(Object.values(SITES).sort(), [
    'https://care.vigilservices.co.uk', 'https://cleaning.vigilservices.co.uk', 'https://security.vigilservices.co.uk',
    'https://staffing.vigilservices.co.uk', 'https://vigilservices.co.uk']);
});

test('v2: the probe list parser takes URLs or paths from a CSV, drops comments, junk and duplicates', () => {
  const list = parseProbeList('URL,Status\n# a comment\nhttps://security.vigilservices.co.uk/old-page,404\n"/quoted",x\n/dup\n/dup\nnot-a-url\n\n   /spaced   extra\n');
  assert.deepEqual(list, ['https://security.vigilservices.co.uk/old-page', '/quoted', '/dup', '/spaced']);
});

test('v2: probe entries are routed by host and anything that matches no crawled site is reported, never dropped', () => {
  const r = routeProbes(['/a', 'https://security.vigilservices.co.uk/x', 'https://cleaning.vigilservices.co.uk/y', 'https://evil.example/z', 'https://security.vigilservices.co.uk.evil.tld/p'], ['security']);
  assert.deepEqual(r.bySite.security, ['/a', 'https://security.vigilservices.co.uk/x']);
  assert.deepEqual(r.unrouted, ['https://cleaning.vigilservices.co.uk/y', 'https://evil.example/z', 'https://security.vigilservices.co.uk.evil.tld/p']);
  const all = routeProbes(['https://cleaning.vigilservices.co.uk/y', 'https://nope.example/'], ['security', 'cleaning']);
  assert.deepEqual(all.bySite, { security: [], cleaning: ['https://cleaning.vigilservices.co.uk/y'] });
  assert.deepEqual(all.unrouted, ['https://nope.example/']);
});

const PROD = 'https://security.vigilservices.co.uk';
const startLoopback = async () => {
  const srv = makeServer(PROD); await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  return { srv, origin: `http://127.0.0.1:${srv.address().port}` };
};

test('C1: assertLoopbackOrigin accepts only a bare loopback http origin', () => {
  assert.equal(assertLoopbackOrigin('http://127.0.0.1:3000'), 'http://127.0.0.1:3000');
  assert.equal(assertLoopbackOrigin('http://localhost:8080/'), 'http://localhost:8080');
  for (const bad of ['https://127.0.0.1:3000', 'http://security.vigilservices.co.uk', 'http://127.0.0.1.evil.tld', 'http://10.0.0.5', 'http://127.0.0.1:3000/x', 'http://u:p@127.0.0.1', 'http://127.0.0.1?x=1', 'nope']) {
    assert.throws(() => assertLoopbackOrigin(bad), /--origin/, bad);
  }
});

test('C1: loopback crawl keeps production-host URLs, requests only the loopback origin and reports the same defects', async () => {
  const { srv, origin } = await startLoopback();
  const before = requests.length;
  try {
    const r = await crawlSite('security', PROD, { delayMs: 0, concurrency: 3, fetchOrigin: origin });
    assert.equal(r.summary.mode, 'loopback'); assert.equal(r.summary.fetch_origin, origin);
    assert.ok(r.summary.pages_crawled >= 8, `crawled ${r.summary.pages_crawled}`);
    assert.ok(r.findings.every((f) => !f.url.startsWith('http://127.0.0.1') || f.rule === 'FETCH_FAILED'), 'findings are reported against production-host URLs');
    const has2 = (rule, part) => r.findings.some((f) => f.rule === rule && f.url.includes(part));
    assert.ok(has2('INTERNAL_URL_ERROR', '/missing'), 'a linked 404 is still found');
    assert.ok(has2('SITEMAP_URL_NOT_200', '/nonexistent'));
    assert.ok(!r.findings.some((f) => f.rule === 'HTTP_NOT_REDIRECTED'), 'the http->https check is skipped in loopback mode');
    assert.ok(!r.findings.some((f) => f.rule === 'CANONICAL_MISSING' && f.url.endsWith('/ok')), 'a production-host canonical on /ok matches /ok');
    assert.ok(requests.slice(before).length > 10, 'requests reached the loopback server');
  } finally { srv.close(); }
});

test('C1: loopback mode refuses a URL on any other host without a request', async () => {
  const { srv, origin } = await startLoopback();
  const before = requests.length;
  try {
    const r = await crawlSite('security', PROD, { delayMs: 0, fetchOrigin: origin, probeUrls: ['https://cleaning.vigilservices.co.uk/x', 'https://example.org/'] });
    assert.ok(r.probes.every((p) => p.refused), JSON.stringify(r.probes));
    assert.ok(!requests.slice(before).some((q) => q.includes('example.org') || q.includes('cleaning')));
    await assert.rejects(() => crawlSite('security', PROD, { delayMs: 0, fetchOrigin: 'https://security.vigilservices.co.uk' }), /--origin/);
  } finally { srv.close(); }
});

test('C1: thresholds come from the shared file', () => {
  // The CRM gate (netyvee/app PageHealthService) reads its own copy of this file. The engine hash below is how a stale copy shows up.
  assert.deepEqual(THRESHOLDS.title.hard, [10, 70]); assert.deepEqual(THRESHOLDS.description.hard, [50, 180]);
  assert.deepEqual(THRESHOLDS.title.target, [20, 65]); assert.deepEqual(THRESHOLDS.description.target, [70, 165]);
  assert.match(engineHash(), /^[0-9a-f]{12}$/);
});

const NOW = new Date('2026-10-21T12:00:00Z');
const entry = (over = {}) => ({ rule: 'BROKEN_IMAGE', path: '/blog', reason: 'logo 400 via /_next/image', owner: 'web', expires: '2026-12-01', ...over });
const doc = (entries, site = 'security') => JSON.stringify({ version: 1, site, entries });

test('C1: baseline validation rejects a bad file and a horizon beyond 90 days', () => {
  assert.deepEqual(loadBaseline(doc([entry()]), 'security', NOW).errors, []);
  const bad = (e, re) => assert.match(loadBaseline(doc([e]), 'security', NOW).errors.join('|'), re);
  bad(entry({ rule: 'NOPE' }), /not a crawler rule/); bad(entry({ path: 'blog' }), /path/); bad(entry({ reason: ' ' }), /reason/); bad(entry({ owner: '' }), /owner/);
  bad(entry({ expires: '2027-06-01' }), /more than 90 days/); bad(entry({ expires: 'soon' }), /YYYY-MM-DD/);
  assert.match(loadBaseline(doc([entry()], 'cleaning'), 'security', NOW).errors.join('|'), /baseline.site/);
  assert.match(loadBaseline('{nope', 'security', NOW).errors[0], /not valid JSON/);
});

test('C1: applyBaseline gates only ERRORs, honours expiry and detail pins, and lists removable entries', () => {
  const f = (rule, url, detail = '', severity = RULES[rule][0]) => ({ rule, url, detail, severity });
  const findings = [f('BROKEN_IMAGE', `${PROD}/blog`, 'logo.png -> 400'), f('BROKEN_IMAGE', `${PROD}/blog`, 'other.png -> 400'), f('DESCRIPTION_LENGTH', `${PROD}/x`, '12 chars'), f('INTERNAL_URL_ERROR', `${PROD}/gone`, 'HTTP 404')];
  let r = applyBaseline(findings, [entry()], NOW);
  assert.equal(r.ok, false); assert.deepEqual(r.new_errors.map((e) => e.rule), ['INTERNAL_URL_ERROR'], 'rule+path covers both images on /blog; the warning never gates');
  r = applyBaseline(findings, [entry({ detail_includes: 'logo.png' })], NOW);
  assert.deepEqual(r.new_errors.map((e) => e.detail), ['other.png -> 400', 'HTTP 404'], 'a detail pin does not cover a different image');
  r = applyBaseline(findings, [entry(), entry({ rule: 'INTERNAL_URL_ERROR', path: '/gone' }), entry({ rule: 'SOFT_404', path: '/old' })], NOW);
  assert.equal(r.ok, true); assert.equal(r.baselined, 3); assert.deepEqual(r.removable, [{ rule: 'SOFT_404', path: '/old', expires: '2026-12-01' }]);
  r = applyBaseline(findings, [entry({ expires: '2026-10-01' })], NOW);
  assert.ok(r.new_errors.some((e) => e.rule === 'BROKEN_IMAGE' && /expired/.test(e.why)), 'an expired entry stops covering its finding');
  assert.equal(applyBaseline([], [entry()], NOW).ok, true);
});

test('C1: CLI exit codes — 1 on a new ERROR, 0 when a baseline accepts every ERROR, 1 again when one entry is missing, 2 on bad input', async () => {
  const { srv, origin } = await startLoopback();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seo-c1-'));
  // async, not spawnSync: the fixture server lives in this process and must keep answering while the CLI crawls it.
  const run = (extra, out, originArg = origin) => new Promise((resolve) => {
    const c = spawn(process.execPath, ['scripts/seo-crawl/technical-seo-crawl.mjs', '--site', 'security', '--origin', originArg, '--delay-ms', '50', '--out', path.join(dir, out), ...extra]);
    let stdout = ''; let stderr = ''; c.stdout.on('data', (d) => { stdout += d; }); c.stderr.on('data', (d) => { stderr += d; });
    const timer = setTimeout(() => c.kill(), 110_000);
    c.on('close', (status) => { clearTimeout(timer); resolve({ status, stdout, stderr }); });
  });
  try {
    const first = await run(['--fail-on-new-errors'], 'a');
    assert.equal(first.status, 1, first.stdout + first.stderr);
    const reg = JSON.parse(fs.readFileSync(path.join(dir, 'a', 'register.json'), 'utf8'));
    assert.match(reg.engine, /^[0-9a-f]{12}$/); assert.equal(reg.gates[0].ok, false);
    const exp = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
    const errs = reg.findings.filter((x) => x.severity === 'ERROR');
    const entries = errs.map((x) => ({ rule: x.rule, path: new URL(x.url).pathname + new URL(x.url).search, reason: 'fixture', owner: 'test', expires: exp }));
    const bl = path.join(dir, 'baseline.json'); fs.writeFileSync(bl, doc(entries));
    const second = await run(['--baseline', bl, '--fail-on-new-errors'], 'b');
    assert.equal(second.status, 0, second.stdout + second.stderr);
    assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'b', 'gate.json'), 'utf8'))[0].ok, true);
    fs.writeFileSync(bl, doc(entries.slice(1)));
    assert.equal((await run(['--baseline', bl, '--fail-on-new-errors'], 'c')).status, 1);
    fs.writeFileSync(bl, doc(entries, 'cleaning'));
    assert.equal((await run(['--baseline', bl, '--fail-on-new-errors'], 'd')).status, 2);
    assert.equal((await run([], 'e', 'https://security.vigilservices.co.uk')).status, 2);
    const noFlag = await run(['--baseline', path.join(dir, 'nope.json')], 'f'); assert.equal(noFlag.status, 2);
  } finally { srv.close(); fs.rmSync(dir, { recursive: true, force: true }); }
});
