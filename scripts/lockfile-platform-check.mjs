#!/usr/bin/env node
/**
 * lockfile-platform-check.mjs — a lockfile that only works on the machine that
 * wrote it is a broken lockfile.
 *
 * WHY THIS EXISTS
 * ---------------
 * `netyvee/main` failed all six of its Vercel deployments. The cause was not the
 * code: `package-lock.json` had been generated on Windows over an already-installed
 * `node_modules`, so it recorded exactly ONE platform binary —
 * `@next/swc-win32-x64-msvc` — where `netyvee/care`'s working lockfile records all
 * nine. Vercel builds on linux-x64 with `npm ci`, which installs strictly from the
 * lockfile, so the Linux SWC binary was simply not there and `next build` died.
 *
 * What made this expensive is that it was INVISIBLE to every check we had:
 *
 *   - the local Windows build passed (the Windows binary was present)
 *   - the CI build would have passed too, because the workflow ran `npm install`,
 *     which is allowed to repair a lockfile, while Vercel runs `npm ci`, which is not
 *
 * So CI green did not imply deploy green, and a passing local build implied even
 * less. Two "successes" that could not have caught the failure.
 *
 * Two rules follow, and both are enforced rather than documented:
 *   1. Every site CI installs with `npm ci`, exactly as the deploy platform does.
 *      A workflow that self-heals a lockfile is testing a tree the deploy never gets.
 *   2. This check runs before the build, so a platform-incomplete lockfile fails
 *      loudly in CI instead of silently at deploy time.
 *
 * THE FIX, when this fails: delete BOTH node_modules and package-lock.json, then
 * `npm install --package-lock-only`. Regenerating over an existing install is what
 * produces a single-platform lockfile in the first place.
 *
 * USAGE: node lockfile-platform-check.mjs [--lockfile package-lock.json]
 *                                         [--require linux-x64]
 */

import { readFileSync } from 'node:fs';

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const lockPath = arg('lockfile', 'package-lock.json');
const [reqOs, reqCpu] = arg('require', 'linux-x64').split('-');

let lock;
try {
  lock = JSON.parse(readFileSync(lockPath, 'utf8'));
} catch (e) {
  console.error(`✖ lockfile-platform-check: cannot read ${lockPath} — ${e.message}`);
  process.exit(1);
}

if (!lock.packages) {
  console.error(`✖ lockfile-platform-check: ${lockPath} has no "packages" map (lockfileVersion >= 2 required).`);
  process.exit(1);
}

// Group platform-specific packages into families by stripping the platform suffix:
//   @next/swc-win32-x64-msvc  ->  @next/swc
//   @esbuild/linux-x64        ->  @esbuild
const PLATFORM_TOKEN = /-(win32|linux|darwin|freebsd|android|sunos|aix)-.*$/;
const families = new Map();

for (const [path, meta] of Object.entries(lock.packages)) {
  if (!path.startsWith('node_modules/')) continue;
  if (!Array.isArray(meta?.os) && !Array.isArray(meta?.cpu)) continue; // not platform-specific

  const name = path.slice(path.lastIndexOf('node_modules/') + 'node_modules/'.length);
  const family = PLATFORM_TOKEN.test(name) ? name.replace(PLATFORM_TOKEN, '') : name.replace(/\/[^/]+$/, '');
  if (!families.has(family)) families.set(family, []);
  families.get(family).push({ name, os: meta.os ?? [], cpu: meta.cpu ?? [] });
}

const missing = [];
for (const [family, members] of families) {
  const ok = members.some((m) => (m.os.length === 0 || m.os.includes(reqOs)) && (m.cpu.length === 0 || m.cpu.includes(reqCpu)));
  if (!ok) missing.push({ family, have: members.map((m) => m.name) });
}

if (missing.length) {
  console.error(`\n✖ lockfile-platform-check: FAILED — ${lockPath} cannot install on ${reqOs}-${reqCpu}.\n`);
  for (const m of missing) {
    console.error(`  ${m.family}: no ${reqOs}-${reqCpu} build in the lockfile`);
    console.error(`    present: ${m.have.join(', ') || '(none)'}`);
  }
  console.error(
    `\n  The deploy platform installs with \`npm ci\`, which will NOT add these for you.\n` +
      `  This build passes locally and fails on deploy — the exact shape of MAIN-01's\n` +
      `  false success.\n\n` +
      `  Fix: rm -rf node_modules package-lock.json && npm install --package-lock-only\n` +
      `  (regenerating over an existing install is what caused it).\n`
  );
  process.exit(1);
}

const total = [...families.values()].reduce((n, m) => n + m.length, 0);
console.log(
  `✓ lockfile-platform-check: ${families.size} platform-specific package family/families ` +
    `(${total} builds) — all installable on ${reqOs}-${reqCpu}.`
);
