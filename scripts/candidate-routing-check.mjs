#!/usr/bin/env node
// candidate-routing-check.mjs — the framework's permanent AUDIENCE-ROUTING gate (Q1.P4).
//
// Enforces, from a data-driven site's content/pages/*.json, that the candidate vs client
// split is never crossed:
//   • CANDIDATE routing goes to the site's OWN recruitment endpoint  (/careers/<div>)
//   • CLIENT    routing goes to the site's OWN enquiry endpoint       (/enquire/<div>)
//   • NEVER to ANOTHER division's /careers or /enquire (or another division's site domain)
//   • a recruitment page (page_type:"recruitment") MUST route candidates OUT to its own
//     careers endpoint (a candidate page with no candidate destination is a mis-wire)
//
// This is the static complement to the per-site Playwright routing specs — it runs with no
// browser and no build, so it can gate every site's CI cheaply and is reusable across
// Cleaning / Security / Care / Staffing / Main. The identity table lives HERE (scripts/,
// outside the src/ scan) so the framework source stays identity-blank.
//
// Usage:
//   node scripts/candidate-routing-check.mjs --own care_staffing [--dir content/pages] [--advisory]
//   node scripts/candidate-routing-check.mjs --division staffing  [--dir content/pages] [--advisory]
//
// Exit: 0 = clean (or --advisory), 1 = cross-routing / mismatch found (fail-closed).

import fs from 'fs';
import path from 'path';

// siteKey → division slug used in the CRM /careers/<slug> and /enquire/<slug> endpoints.
const SITE_TO_DIVISION = {
  cleaning: 'cleaning',
  security: 'security',
  care_services: 'care',
  care_staffing: 'staffing',
};
const ALL_DIVISIONS = ['cleaning', 'security', 'care', 'staffing'];
const DIVISION_DOMAINS = {
  cleaning: 'cleaning.vigilservices.co.uk',
  security: 'security.vigilservices.co.uk',
  care: 'care.vigilservices.co.uk',
  staffing: 'staffing.vigilservices.co.uk',
};

const args = process.argv.slice(2);
const opt = (name, dflt = null) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : dflt;
};
const advisory = args.includes('--advisory');

let division = opt('--division');
const own = opt('--own');
if (!division && own) division = SITE_TO_DIVISION[own];
if (!division || !ALL_DIVISIONS.includes(division)) {
  console.error(`candidate-routing-check: need --division <${ALL_DIVISIONS.join('|')}> or --own <${Object.keys(SITE_TO_DIVISION).join('|')}>`);
  process.exit(1);
}
const dir = opt('--dir', 'content/pages');

const OWN_CAREERS = `/careers/${division}`;
const OWN_ENQUIRE = `/enquire/${division}`;
const FOREIGN = ALL_DIVISIONS.filter((d) => d !== division);

// Pull every URL-ish string out of an arbitrary JSON value.
function collectUrls(node, urls) {
  if (node == null) return;
  if (typeof node === 'string') {
    if (/(careers|enquire|vigilservices)/i.test(node) || node.startsWith('/') || node.startsWith('http')) {
      urls.push(node);
    }
    return;
  }
  if (Array.isArray(node)) { for (const v of node) collectUrls(v, urls); return; }
  if (typeof node === 'object') { for (const v of Object.values(node)) collectUrls(v, urls); }
}

// Classify a URL relative to THIS division.
function classify(url) {
  const u = url.toLowerCase();
  // Foreign division endpoints / domains — always a violation.
  for (const f of FOREIGN) {
    if (u.includes(`/careers/${f}`)) return { kind: 'foreign_careers', division: f };
    if (u.includes(`/enquire/${f}`)) return { kind: 'foreign_enquire', division: f };
    if (u.includes(DIVISION_DOMAINS[f])) return { kind: 'foreign_domain', division: f };
  }
  if (u.includes(OWN_CAREERS)) return { kind: 'own_careers' };
  if (u.includes(OWN_ENQUIRE)) return { kind: 'own_enquire' };
  return { kind: 'other' };
}

function walk(d, out = []) {
  if (!fs.existsSync(d)) return out;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const fp = path.join(d, e.name);
    if (e.isDirectory()) walk(fp, out);
    else if (e.name.endsWith('.json')) out.push(fp);
  }
  return out;
}

const files = walk(dir);
if (!files.length) {
  console.error(`candidate-routing-check: no JSON pages under ${dir}`);
  process.exit(1);
}

const violations = [];
let recruitmentPages = 0;
let scanned = 0;

for (const fp of files) {
  let page;
  try { page = JSON.parse(fs.readFileSync(fp, 'utf8')); }
  catch (e) { violations.push(`${fp}: invalid JSON (${e.message})`); continue; }
  scanned++;
  const rel = path.relative(dir, fp);
  const pageType = (page.page_type || '').toLowerCase();

  const urls = [];
  collectUrls(page, urls);
  const classes = urls.map((u) => ({ url: u, ...classify(u) }));

  // 1) No FOREIGN routing anywhere (cross-division leak).
  for (const c of classes) {
    if (c.kind.startsWith('foreign_')) {
      violations.push(`${rel}: routes to FOREIGN division "${c.division}" (${c.kind}) → ${c.url}`);
    }
  }

  // 2) Recruitment pages MUST route candidates OUT to the own careers endpoint.
  if (pageType === 'recruitment') {
    recruitmentPages++;
    const hasOwnCareers = classes.some((c) => c.kind === 'own_careers');
    if (!hasOwnCareers) {
      violations.push(`${rel}: page_type=recruitment but NO candidate destination (${OWN_CAREERS}) found — mis-wired candidate page.`);
    }
    // A recruitment page should not push candidates into the CLIENT enquiry as a content CTA.
    const ownEnquireCtas = classes.filter((c) => c.kind === 'own_enquire');
    if (ownEnquireCtas.length && !hasOwnCareers) {
      violations.push(`${rel}: recruitment page routes to the CLIENT enquiry (${OWN_ENQUIRE}) with no candidate route — audience mismatch.`);
    }
  }
}

console.log(`candidate-routing-check: division=${division} · scanned ${scanned} pages (${recruitmentPages} recruitment) · own careers=${OWN_CAREERS} · own enquiry=${OWN_ENQUIRE}`);

if (violations.length) {
  console.error(`\n${advisory ? 'ADVISORY' : 'FAILED'} — ${violations.length} audience-routing issue(s):`);
  for (const v of violations) console.error(`  • ${v}`);
  if (advisory) {
    console.error('\n(advisory mode — not failing the build)');
    process.exit(0);
  }
  process.exit(1);
}
console.log('candidate-routing-check: OK — no cross-division routing, no candidate/client mismatch.');
