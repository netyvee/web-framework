#!/usr/bin/env node
// division-isolation-check.mjs — the framework's permanent division-isolation test.
//
// Two modes:
//   --mode src                      (framework CI) src/ must contain ZERO division
//                                   identity literals — any division's phone (any
//                                   form), site domain, or trading name fails.
//   --mode built [--own <siteKey>]  (consumer CI, after `next build`) the prerendered
//        [--config <file>]          HTML must contain ZERO FOREIGN division values.
//                                   Own lists derive from --own (built-in table) or a
//                                   seo-governance.config.json via --config.
//                                   /admin output is excluded (frozen internal tools,
//                                   C-13).
//
// The identity table lives HERE (scripts/, outside the src/ scan scope) precisely so
// the framework source itself can stay identity-blank.

import fs from 'fs';
import path from 'path';

const DIVISIONS = {
  cleaning: { phone: '020 3098 6037', domain: 'cleaning.vigilservices.co.uk', name: 'Vigil Cleaning Services' },
  security: { phone: '020 3973 8892', domain: 'security.vigilservices.co.uk', name: 'Vigil Security Services' },
  care_services: { phone: '020 3973 8886', domain: 'care.vigilservices.co.uk', name: 'Vigil Care Services' },
  care_staffing: { phone: '020 3973 8887', domain: 'staffing.vigilservices.co.uk', name: 'Vigil Care Staffing' },
};

const phoneForms = (p) => {
  const compact = p.replace(/\s+/g, '');
  return [p, compact, compact.replace(/^0/, '+44')];
};

const args = process.argv.slice(2);
const opt = (name, dflt = null) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : dflt;
};
const mode = opt('--mode', 'src');

function walk(dir, exts, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fp, exts, out);
    else if (exts.some((e) => entry.name.endsWith(e))) out.push(fp);
  }
  return out;
}

let failures = 0;
const fail = (msg) => {
  console.error(msg);
  failures++;
};

if (mode === 'src') {
  const root = path.join(process.cwd(), 'src');
  const files = walk(root, ['.ts', '.tsx']);
  const needles = Object.values(DIVISIONS).flatMap((d) => [
    ...phoneForms(d.phone),
    d.domain,
    d.name,
  ]);
  for (const fp of files) {
    const body = fs.readFileSync(fp, 'utf8');
    for (const n of needles) {
      if (body.includes(n)) fail(`IDENTITY LITERAL "${n}" in ${path.relative(root, fp)}`);
    }
  }
  if (failures) {
    console.error(`\ndivision-isolation (src): FAILED — ${failures} identity literal(s). The framework must be identity-blank.`);
    process.exit(1);
  }
  console.log(`division-isolation (src): OK — ${files.length} files identity-blank.`);
} else if (mode === 'built') {
  let forbiddenPhones = [];
  let forbiddenDomains = [];
  let ownLabel = '';
  const own = opt('--own');
  const cfgPath = opt('--config');
  if (own) {
    if (!DIVISIONS[own]) {
      console.error(`Unknown site key "${own}". Valid: ${Object.keys(DIVISIONS).join(', ')}`);
      process.exit(1);
    }
    ownLabel = DIVISIONS[own].domain;
    for (const [key, d] of Object.entries(DIVISIONS)) {
      if (key === own) continue;
      forbiddenPhones.push(...phoneForms(d.phone));
      forbiddenDomains.push(d.domain);
    }
  } else if (cfgPath) {
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    ownLabel = new URL(cfg.domain).hostname;
    forbiddenPhones = (cfg.nap?.forbiddenPhones ?? []).flatMap(phoneForms);
    forbiddenDomains = Object.values(DIVISIONS)
      .map((d) => d.domain)
      .filter((d) => d !== ownLabel);
  } else {
    console.error('built mode needs --own <siteKey> or --config <seo-governance.config.json>');
    process.exit(1);
  }

  const root = path.join(process.cwd(), '.next', 'server', 'app');
  if (!fs.existsSync(root)) {
    console.error(`division-isolation (built): no build output at ${root} — run next build first.`);
    process.exit(1);
  }
  const pages = walk(root, ['.html']).filter((fp) => !fp.replace(/\\/g, '/').includes('/app/admin'));
  for (const fp of pages) {
    const html = fs.readFileSync(fp, 'utf8');
    const rel = path.relative(root, fp);
    for (const p of forbiddenPhones) if (html.includes(p)) fail(`FOREIGN PHONE "${p}" in ${rel}`);
    for (const d of forbiddenDomains) if (html.includes(d)) fail(`FOREIGN DIVISION DOMAIN "${d}" in ${rel}`);
  }
  if (failures) {
    console.error(`\ndivision-isolation (built): FAILED — ${failures} cross-division value(s) in public output.`);
    process.exit(1);
  }
  console.log(`division-isolation (built): OK — ${pages.length} pages clean (own: ${ownLabel}).`);
} else {
  console.error(`Unknown --mode "${mode}" (src|built)`);
  process.exit(1);
}
