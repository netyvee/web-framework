// F2-07 item B (netyvee/app#344) — seo-integrity-check.mjs, lifted verbatim
// from netyvee/vigil-cleaning's and netyvee/security's standalone copies
// (which had diverged by nothing but a comment). This runs the shared bin
// script as a real subprocess against a synthetic site, the same way
// consumer CI invokes it, rather than re-implementing its ~700 lines of
// scanning logic — a change to the script itself cannot silently diverge
// from what's actually asserted here.
//
// Byte-for-byte output parity against each site's REAL current config and
// content is proven separately, in the consumer retirement PRs, by running
// both the old local script and this shared copy against the same real
// checkout and diffing stdout + seo-integrity-report.json.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const SCRIPT = path.resolve(__dirname, '../bin/seo-integrity-check.mjs');
const BASE = 'https://example.vigilservices.co.uk';

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'vf-seo-check-'));
  mkdirSync(path.join(dir, 'app'), { recursive: true });
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

function writeConfig(overrides: Record<string, unknown> = {}) {
  const cfg = {
    site: 'example',
    division: 'example',
    domain: 'example.vigilservices.co.uk',
    canonicalBase: BASE,
    trailingSlash: false,
    nap: { phone: '020 1111 1111', phoneE164: '+442011111111', forbiddenPhones: ['020 2222 2222'] },
    forbiddenClaims: ['ISO certified'],
    ...overrides,
  };
  writeFileSync(path.join(dir, 'seo-governance.config.json'), JSON.stringify(cfg, null, 2));
}

function writeHomePage(canonical = `${BASE}/`) {
  writeFileSync(
    path.join(dir, 'app', 'page.tsx'),
    `export const metadata = {\n  title: 'Home | Example',\n  description: 'A sufficiently long description of the example home page.',\n  canonical: '${canonical}',\n};\nexport default function Page() { return null; }\n`
  );
}

function writeSitemap(urls: string[] = [`${BASE}/`]) {
  writeFileSync(
    path.join(dir, 'app', 'sitemap.ts'),
    `export default function sitemap() {\n  return [\n${urls.map((u) => `    { url: '${u}' },`).join('\n')}\n  ];\n}\n`
  );
}

function run(args: string[] = []): { code: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync('node', [SCRIPT, ...args], { cwd: dir, encoding: 'utf8' });
    return { code: 0, stdout, stderr: '' };
  } catch (e: any) {
    return { code: e.status ?? 1, stdout: e.stdout ?? '', stderr: e.stderr ?? '' };
  }
}

describe('seo-integrity-check.mjs (F2-07 item B shared engine)', () => {
  it('FATAL exit 2 when the config file is missing', () => {
    const result = run();
    expect(result.code).toBe(2);
  });

  it('FATAL exit 2 when the config schema is invalid', () => {
    writeConfig({ forbiddenClaims: [] });
    const result = run();
    expect(result.code).toBe(2);
    expect(result.stderr).toContain('invalid');
  });

  it('passes a correctly-canonicalised, sitemap-listed page', () => {
    writeConfig();
    writeHomePage();
    writeSitemap();
    const result = run();
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('PASS.');
    const report = JSON.parse(readFileSync(path.join(dir, 'seo-integrity-report.json'), 'utf8'));
    expect(report.result).toBe('pass');
  });

  it('H_MISSING_CANONICAL hard-blocks a page with no canonical', () => {
    writeConfig();
    writeFileSync(
      path.join(dir, 'app', 'page.tsx'),
      `export const metadata = { title: 'Home', description: 'desc' };\nexport default function Page() { return null; }\n`
    );
    writeSitemap([]);
    const result = run();
    expect(result.code).toBe(1);
    expect(result.stdout).toContain('H_MISSING_CANONICAL');
  });

  it('H_CANONICAL_FORM hard-blocks a canonical that disagrees with trailingSlash policy', () => {
    writeConfig();
    writeHomePage(`${BASE}/`);
    // a non-root page with a trailing slash under trailingSlash:false
    mkdirSync(path.join(dir, 'app', 'about'), { recursive: true });
    writeFileSync(
      path.join(dir, 'app', 'about', 'page.tsx'),
      `export const metadata = {\n  title: 'About',\n  description: 'About the example site, long enough.',\n  canonical: '${BASE}/about/',\n};\nexport default function Page() { return null; }\n`
    );
    writeSitemap([`${BASE}/`, `${BASE}/about`]);
    const result = run();
    expect(result.code).toBe(1);
    expect(result.stdout).toContain('H_CANONICAL_FORM');
  });

  it('H_NAP_PHONE hard-blocks a forbidden phone number anywhere in scanned source', () => {
    writeConfig();
    writeFileSync(
      path.join(dir, 'app', 'page.tsx'),
      `export const metadata = {\n  title: 'Home',\n  description: 'A sufficiently long description.',\n  canonical: '${BASE}/',\n};\nexport default function Page() { return <p>Call us on 020 2222 2222</p>; }\n`
    );
    writeSitemap();
    const result = run();
    expect(result.code).toBe(1);
    expect(result.stdout).toContain('H_NAP_PHONE');
  });

  it('H_SITEMAP_CANONICAL hard-blocks a sitemap entry with no matching indexable page', () => {
    writeConfig();
    writeHomePage();
    writeSitemap([`${BASE}/`, `${BASE}/ghost`]);
    const result = run();
    expect(result.code).toBe(1);
    expect(result.stdout).toContain('H_SITEMAP_CANONICAL');
  });

  it('--report-only always exits 0 even with hard blocks present', () => {
    writeConfig();
    writeFileSync(
      path.join(dir, 'app', 'page.tsx'),
      `export const metadata = { title: 'Home', description: 'desc' };\nexport default function Page() { return null; }\n`
    );
    writeSitemap([]);
    const result = run(['--report-only']);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('H_MISSING_CANONICAL');
    expect(result.stdout).toContain('REPORT-ONLY');
  });

  it('resolves every path against the invoking repo\'s cwd, not the framework package', () => {
    writeConfig();
    writeHomePage();
    writeSitemap();
    run();
    expect(() => readFileSync(path.join(dir, 'seo-integrity-report.json'), 'utf8')).not.toThrow();
    expect(() => readFileSync(path.join(dir, '.seo-baseline.json'), 'utf8')).not.toThrow();
  });
});
