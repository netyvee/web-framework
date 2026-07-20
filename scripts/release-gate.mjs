#!/usr/bin/env node
/**
 * Release gate — WF-GOV-01.
 *
 * `docs/SEMVER-POLICY.md` already said every tag gets release notes and that the
 * compatibility matrix is updated every release. Both rules were broken for a year of
 * tags — 18 tags against 6 GitHub Releases, and a matrix stale at v0.3.0 while tags
 * ran to v0.4.10 — because nothing checked. A policy nothing enforces is a suggestion.
 *
 * This is the check. It runs on tag builds and fails them.
 *
 *   node scripts/release-gate.mjs            # infer the tag from GITHUB_REF
 *   node scripts/release-gate.mjs v0.4.11    # explicit
 *
 * Deliberately NOT checked here: consumer drift (policy item: warn at 2 minors, fail
 * at 4). That needs to read other repositories' lockfiles, which this repo cannot see
 * from its own CI without cross-repo credentials. It belongs in the CRM's governance
 * pass, and is recorded in WF-GOV-01 rather than silently dropped.
 */
import fs from 'node:fs';
import path from 'node:path';

const argTag = process.argv[2];
const refTag = (process.env.GITHUB_REF ?? '').startsWith('refs/tags/')
  ? process.env.GITHUB_REF.slice('refs/tags/'.length)
  : null;
const tag = argTag ?? refTag;

if (!tag) {
  console.log('release-gate: not a tag build (no tag argument and GITHUB_REF is not a tag) — skipping.');
  process.exit(0);
}

const errors = [];

// ── 1. package.json version must equal the tag ───────────────────────────────
// This is exactly how v0.4.9 and v0.4.10 shipped: the manifest stayed at 0.4.8, so an
// install pinned to #v0.4.10 reported 0.4.8 in the consumer's lockfile. A consumer
// reading its own lockfile was told the wrong version of the code it was running.
const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
const expected = tag.replace(/^v/, '');
if (pkg.version !== expected) {
  errors.push(
    `package.json version is "${pkg.version}" but the tag is "${tag}" (expected "${expected}"). ` +
    `Bump the manifest before tagging — a mismatch makes every consumer lockfile report the wrong version.`
  );
}

// ── 2. The tag must have release notes ───────────────────────────────────────
// CHANGELOG.md is the source of truth here; GitHub Releases are generated from it.
const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
if (!fs.existsSync(changelogPath)) {
  errors.push('CHANGELOG.md is missing entirely.');
} else {
  const changelog = fs.readFileSync(changelogPath, 'utf8');
  // Match a heading for this exact version, e.g. "## v0.4.11 (2026-07-20) — ..."
  const heading = new RegExp(`^##\\s+${tag.replace(/\./g, '\\.')}\\b`, 'm');
  if (!heading.test(changelog)) {
    errors.push(
      `CHANGELOG.md has no "## ${tag}" section. docs/SEMVER-POLICY.md requires release notes for ` +
      `every tag; 12 tags from v0.3.3 onward shipped without them, which is why this gate exists.`
    );
  }
}

// ── 3. The compatibility matrix must mention this version ────────────────────
const policyPath = path.join(process.cwd(), 'docs', 'SEMVER-POLICY.md');
if (!fs.existsSync(policyPath)) {
  errors.push('docs/SEMVER-POLICY.md is missing entirely.');
} else {
  const policy = fs.readFileSync(policyPath, 'utf8');
  if (!policy.includes(tag)) {
    errors.push(
      `docs/SEMVER-POLICY.md's compatibility matrix does not mention ${tag}. It stood eight ` +
      `released versions stale (at v0.3.0, marked "current") precisely because nothing checked.`
    );
  }
}

if (errors.length) {
  console.error(`\nrelease-gate: FAILED for ${tag}\n`);
  for (const e of errors) console.error(`  ✖ ${e}\n`);
  process.exit(1);
}

console.log(`release-gate: OK — ${tag} has a matching manifest version, release notes, and a matrix entry.`);
