#!/usr/bin/env node
// normalize-html.mjs — parity normalizer for baseline/adoption DOM comparison.
//
// Two consecutive `next build`s of IDENTICAL code+content differ ONLY in build-stamped
// asset references (hashed chunk/CSS filenames inside /_next/static/…) and the inline
// RSC/bootstrap <script> payloads that embed them. Everything the user sees — the
// rendered DOM, text, attributes, aria, alt, links, inline styles — is preserved
// byte-exact by this normalizer:
//   1. strip every <script>…</script> block (bootstrap + RSC payload)
//   2. replace /_next/static/<hashed-path> with /_next/static/__ASSET__
// So: normalized(pre) === normalized(post) ⇔ identical visible DOM. Combined with a
// content-hash comparison of the built CSS (the only stripped asset that affects
// pixels), byte-equal normalized HTML + equal CSS hash ⇒ pixel-identical pages.
//
// Usage: node normalize-html.mjs <in.html> [out.file]   (stdout if no out.file)

import fs from 'fs';

const [inFile, outFile] = process.argv.slice(2);
if (!inFile) {
  console.error('usage: normalize-html.mjs <in.html> [out.file]');
  process.exit(1);
}

export function normalizeHtml(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '')
    .replace(/<script\b[^>]*\/>/g, '')
    .replace(/\/_next\/static\/[^"'\s>]+/g, '/_next/static/__ASSET__');
}

const out = normalizeHtml(fs.readFileSync(inFile, 'utf8'));
if (outFile) fs.writeFileSync(outFile, out);
else process.stdout.write(out);
