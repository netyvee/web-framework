// WEBSITE-DEPLOYMENT-ATTESTATION-01 (netyvee/app#344) — the shared attestation
// Route Handler every framework-adopted site wires up identically.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GET, buildAttestationPayload } from '../src/attestation';

const VERCEL_VARS = [
  'VERCEL_GIT_COMMIT_SHA', 'VERCEL_GIT_COMMIT_REF', 'VERCEL_TARGET_ENV', 'VERCEL_ENV',
  'VERCEL_GIT_REPO_OWNER', 'VERCEL_GIT_REPO_SLUG', 'VERCEL_URL', 'VERCEL_PROJECT_PRODUCTION_URL',
];
const savedEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of VERCEL_VARS) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of VERCEL_VARS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});

describe('buildAttestationPayload — no site-specific defaults', () => {
  it('falls back to null for every field when no Vercel env vars are set (fail-closed, never guesses identity)', () => {
    const payload = buildAttestationPayload();
    expect(payload).toEqual({
      git_sha: null, git_ref: null, environment: null,
      repo_owner: null, repo_slug: null, deployment_url: null, production_url: null,
    });
  });

  it('reports every field verbatim from the corresponding Vercel env var', () => {
    process.env.VERCEL_GIT_COMMIT_SHA = 'abc1234deadbeef';
    process.env.VERCEL_GIT_COMMIT_REF = 'main';
    process.env.VERCEL_TARGET_ENV = 'production';
    process.env.VERCEL_GIT_REPO_OWNER = 'netyvee';
    process.env.VERCEL_GIT_REPO_SLUG = 'care';
    process.env.VERCEL_URL = 'care-git-main.vercel.app';
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'care.vigilservices.co.uk';

    expect(buildAttestationPayload()).toEqual({
      git_sha: 'abc1234deadbeef',
      git_ref: 'main',
      environment: 'production',
      repo_owner: 'netyvee',
      repo_slug: 'care',
      deployment_url: 'https://care-git-main.vercel.app',
      production_url: 'https://care.vigilservices.co.uk',
    });
  });

  it('prefers VERCEL_TARGET_ENV over VERCEL_ENV when both are set', () => {
    process.env.VERCEL_TARGET_ENV = 'production';
    process.env.VERCEL_ENV = 'preview';
    expect(buildAttestationPayload().environment).toBe('production');
  });

  it('falls back to VERCEL_ENV when VERCEL_TARGET_ENV is unset', () => {
    process.env.VERCEL_ENV = 'preview';
    expect(buildAttestationPayload().environment).toBe('preview');
  });
});

describe('GET — the actual Route Handler response', () => {
  it('returns 200 JSON with no-store caching and the payload shape', async () => {
    process.env.VERCEL_GIT_COMMIT_SHA = 'abc1234deadbeef';
    process.env.VERCEL_GIT_REPO_OWNER = 'netyvee';
    process.env.VERCEL_GIT_REPO_SLUG = 'staffing';

    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(res.headers.get('cache-control')).toContain('no-store');

    const body = await res.json();
    expect(body.git_sha).toBe('abc1234deadbeef');
    expect(body.repo_owner).toBe('netyvee');
    expect(body.repo_slug).toBe('staffing');
  });

  it('never exposes any secret/token-shaped value', async () => {
    const res = await GET();
    const text = await res.text();
    expect(text.toLowerCase()).not.toContain('token');
    expect(text.toLowerCase()).not.toContain('secret');
  });
});
