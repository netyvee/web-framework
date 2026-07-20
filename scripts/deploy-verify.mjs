#!/usr/bin/env node
/**
 * deploy-verify.mjs — prove a deploy actually happened, or fail.
 *
 * WHY THIS EXISTS
 * ---------------
 * On 2026-07-20 the corporate main-site migration (MAIN-01) was reported to the
 * founder as a successful deploy with "verified rendering". Every one of the six
 * Vercel deployments for `netyvee/main` had in fact failed, and the repository's
 * own README asserted "No Vercel project. Nothing is deployed." — an assertion
 * contradicted by a single unrun API call (`GET /repos/:repo/deployments`).
 *
 * Nothing in the pipeline lied. The CRM printed "NOT VERIFIED AS RENDERED" and
 * recorded the run as `deployed_unverified`. The false success was produced at the
 * reporting layer, by treating weaker evidence as if it were proof:
 *
 *     a git push succeeded            -> not a deploy
 *     a workflow was triggered        -> not a deploy
 *     a build passed LOCALLY          -> not a deploy
 *     a build passed in CI            -> not a deploy
 *     GitHub accepted a commit        -> not a deploy
 *     no deployment record was seen   -> NOT evidence that none exists
 *
 * The only thing that proves a deploy is a deployment status polled to a terminal
 * state and read. This script does exactly that and nothing else, so that "it
 * deployed" stops being a judgement call.
 *
 * DESIGN RULES, each one bought with a real failure:
 *
 *  1. ABSENCE IS FAILURE. If no deployment exists for the sha, that is a failed
 *     verification, never a pass. "I didn't see one" is how the README got it wrong.
 *  2. NON-TERMINAL IS NOT SUCCESS. `queued` / `in_progress` / `pending` mean the
 *     answer is not in yet. Three times in one session a still-`queued` run was
 *     written up as a result. Polling to terminal is the whole point.
 *  3. TIMEOUT IS FAILURE, never an assumed pass.
 *  4. RENDER IS SEPARATE FROM DEPLOY. A green deployment says the build shipped.
 *     It does not say the approved content is on the page. Pass --url and --marker
 *     to assert that too; without them the script reports deploy-only and says so.
 *
 * USAGE
 *   node deploy-verify.mjs --repo netyvee/main --sha <sha> \
 *        [--timeout 900] [--url https://site/path] [--marker "STRING"]
 *
 * AUTH: GITHUB_TOKEN (or GH_TOKEN) with `repo` scope — the same token the CRM
 * already uses to commit content. Deployment status needs no Vercel credentials,
 * which is why "deploy verification is blocked on a founder gate" was wrong.
 *
 * EXIT: 0 only when a terminal `success` was observed (and the marker matched, if
 * one was given). Any other outcome is a non-zero exit and a stated reason.
 */

const TERMINAL = new Set(['success', 'failure', 'error', 'inactive']);
const PENDING = new Set(['queued', 'in_progress', 'pending', 'waiting']);

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const repo = arg('repo');
const sha = arg('sha');
const url = arg('url');
const marker = arg('marker');
const timeoutSec = Number(arg('timeout', '900'));
const intervalSec = Number(arg('interval', '15'));
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

function die(msg) {
  console.error(`\n✖ DEPLOY NOT VERIFIED — ${msg}\n`);
  process.exit(1);
}

if (!repo || !sha) die('usage: --repo <owner/name> --sha <sha> [--url U --marker M]');
if (!token) die('GITHUB_TOKEN is not set. Refusing to guess — an unverifiable check must fail, not pass.');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function gh(path) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/vnd.github+json',
      'user-agent': 'vigil-deploy-verify',
    },
  });
  if (!res.ok) die(`GitHub API ${res.status} on ${path}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

const deadline = Date.now() + timeoutSec * 1000;
const left = () => Math.max(0, Math.round((deadline - Date.now()) / 1000));

console.log(`deploy-verify: ${repo}@${sha.slice(0, 7)} — polling for a terminal deployment status (timeout ${timeoutSec}s)`);

let deployments = [];
while (Date.now() < deadline) {
  deployments = await gh(`/repos/${repo}/deployments?sha=${sha}&per_page=100`);
  if (deployments.length) break;
  console.log(`  no deployment record yet for this sha — ${left()}s left`);
  await sleep(intervalSec * 1000);
}

// RULE 1. Not finding one is a failure, not a pass.
if (!deployments.length) {
  die(
    `no deployment was ever created for ${sha.slice(0, 7)} within ${timeoutSec}s.\n` +
      `  This means the deploy did not start — a linked project, a build hook or a\n` +
      `  push trigger is missing. It does NOT mean "nothing needed to deploy".`
  );
}

let latest = null;
while (Date.now() < deadline) {
  const seen = [];
  for (const d of deployments) {
    const statuses = await gh(`/repos/${repo}/deployments/${d.id}/statuses?per_page=100`);
    const state = statuses[0]?.state ?? 'pending';
    seen.push({ id: d.id, env: d.environment, state, status: statuses[0] ?? null });
  }
  seen.sort((a, b) => b.id - a.id);
  latest = seen[0];

  if (TERMINAL.has(latest.state)) break;
  console.log(`  deployment ${latest.id} (${latest.env}) is "${latest.state}" — not terminal, ${left()}s left`);
  await sleep(intervalSec * 1000);
  deployments = await gh(`/repos/${repo}/deployments?sha=${sha}&per_page=100`);
}

// RULE 3. Running out of time is not a pass.
if (!latest || !TERMINAL.has(latest.state)) {
  die(
    `timed out after ${timeoutSec}s with the deployment still "${latest?.state ?? 'unknown'}".\n` +
      `  A non-terminal state is not a success. Re-run with a longer --timeout.`
  );
}

// RULE 2. Terminal, but terminal-bad is still bad.
if (latest.state !== 'success') {
  die(
    `deployment ${latest.id} (${latest.env}) ended "${latest.state}".\n` +
      `  ${latest.status?.description ?? '(no description)'}\n` +
      `  ${latest.status?.target_url ?? ''}`
  );
}

const deployedUrl = latest.status?.environment_url ?? null;
console.log(`✓ deployment ${latest.id} (${latest.env}) reached terminal state "success"`);
if (deployedUrl) console.log(`  environment_url: ${deployedUrl}`);

// RULE 4. Deploy proven. Render is a separate claim and needs separate evidence.
if (!url || !marker) {
  console.log(
    '\n⚠ DEPLOY VERIFIED, RENDER NOT VERIFIED.\n' +
      '  A green deployment proves the build shipped. It does not prove the approved\n' +
      '  content is on the page. Pass --url and --marker to prove that too.\n'
  );
  process.exit(0);
}

console.log(`\ndeploy-verify: fetching ${url} to confirm the content actually rendered`);
const res = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'vigil-deploy-verify' } });
if (!res.ok) die(`the deployed URL returned HTTP ${res.status}. A green deploy that does not serve is not a success.`);

const html = await res.text();

// A Vercel preview behind SSO answers 200 with a login page. That is not the site,
// and grepping it for a marker would silently "pass" on the wrong document.
if (/vercel\.com\/(login|sso)/.test(res.url) || /Authentication Required|vercel-sso/i.test(html.slice(0, 4000))) {
  die(
    `${res.url} is a Vercel SSO/login page, not the site. Deployment protection is on,\n` +
      `  so this URL cannot prove a render. Verify against a public URL instead.`
  );
}

if (!html.includes(marker)) {
  die(
    `the page served from ${url} does not contain the marker ${JSON.stringify(marker)}.\n` +
      `  The deploy succeeded but the approved content is not on the page.`
  );
}

console.log(`✓ RENDER VERIFIED — marker present in the document actually served by ${res.url}`);
process.exit(0);
