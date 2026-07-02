#!/usr/bin/env node
// capture-baseline.mjs — capture a consumer site's behavioural baseline as the
// framework parity fixture (F1.1 methodology; see fixtures/<site>-baseline/BASELINE.md).
//
// Captures from the site's `.next` build output:
//   pages/*.html      — normalized prerendered DOM (normalize-html.mjs rules)
//   css/*.css         — the built stylesheet(s), content-addressed
//   sitemap.xml       — with <lastmod> neutralised (sitemap stamps build time)
//   inventory.json    — per page: title, description, canonical, og:title, image
//                       count, images-missing-alt, own-phone presence
//   hashes.json       — sha256 per normalized page + css content
//
// Usage: node capture-baseline.mjs --site <dir> --out <fixtureDir> --phone "020 XXXX XXXX"

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { normalizeHtml } from './normalize-html.mjs';

const args = process.argv.slice(2);
const opt = (n) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : null;
};
const siteDir = opt('--site');
const outDir = opt('--out');
const ownPhone = opt('--phone') ?? '';
if (!siteDir || !outDir) {
  console.error('usage: capture-baseline.mjs --site <dir> --out <fixtureDir> [--phone "..."]');
  process.exit(1);
}

const appDir = path.join(siteDir, '.next', 'server', 'app');
const cssDir = path.join(siteDir, '.next', 'static', 'css');
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const pick = (html, re) => (html.match(re) ?? [, null])[1];

fs.mkdirSync(path.join(outDir, 'pages'), { recursive: true });
fs.mkdirSync(path.join(outDir, 'css'), { recursive: true });

const hashes = { pages: {}, css: {} };
const inventory = {};

for (const f of fs.readdirSync(appDir).filter((f) => f.endsWith('.html'))) {
  const raw = fs.readFileSync(path.join(appDir, f), 'utf8');
  const norm = normalizeHtml(raw);
  fs.writeFileSync(path.join(outDir, 'pages', f), norm);
  hashes.pages[f] = sha(norm);
  const imgs = norm.match(/<img\b[^>]*>/g) ?? [];
  inventory[f] = {
    title: pick(norm, /<title>([^<]*)<\/title>/),
    description: pick(norm, /<meta name="description" content="([^"]*)"/),
    canonical: pick(norm, /<link rel="canonical" href="([^"]*)"/),
    og_title: pick(norm, /<meta property="og:title" content="([^"]*)"/),
    image_count: imgs.length,
    images_missing_alt: imgs.filter((t) => !/\balt="[^"]+"/.test(t)).length,
    own_phone_present: ownPhone ? norm.includes(ownPhone) : null,
  };
}

if (fs.existsSync(cssDir)) {
  for (const f of fs.readdirSync(cssDir).filter((f) => f.endsWith('.css'))) {
    const body = fs.readFileSync(path.join(cssDir, f), 'utf8');
    // content-addressed name: the hashed filename changes per build, the CONTENT is
    // what parity compares.
    const h = sha(body);
    fs.writeFileSync(path.join(outDir, 'css', `${h.slice(0, 16)}.css`), body);
    hashes.css[h] = f;
  }
}

const sitemapBody = path.join(appDir, 'sitemap.xml.body');
if (fs.existsSync(sitemapBody)) {
  const sm = fs
    .readFileSync(sitemapBody, 'utf8')
    .replace(/<lastmod>[^<]*<\/lastmod>/g, '<lastmod>__DATE__</lastmod>');
  fs.writeFileSync(path.join(outDir, 'sitemap.xml'), sm);
  hashes.sitemap = sha(sm);
}

fs.writeFileSync(path.join(outDir, 'hashes.json'), JSON.stringify(hashes, null, 2));
fs.writeFileSync(path.join(outDir, 'inventory.json'), JSON.stringify(inventory, null, 2));
console.log(`baseline captured: ${Object.keys(hashes.pages).length} pages, ${Object.keys(hashes.css).length} css, sitemap=${!!hashes.sitemap} -> ${outDir}`);
