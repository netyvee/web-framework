// F2-06 item D (netyvee/app#344) — division-isolation-check.mjs's `--own main` mode,
// generalised from netyvee/main's own scripts/content-check.mjs. Unlike every other
// `--own <siteKey>`, main is not a division: domains stay ALLOWED (linking to all four
// is the corporate site's purpose, D-033) and ALL FOUR division phones are forbidden
// (main has no "own" phone to exclude). These tests run the script as a real subprocess
// against synthetic build output — the same way consumer CI invokes it — rather than
// re-implementing its logic, so a change to the script itself cannot silently diverge
// from what's actually asserted here.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const SCRIPT = path.resolve(__dirname, '../scripts/division-isolation-check.mjs');

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'vf-isolation-main-'));
  mkdirSync(path.join(dir, '.next', 'server', 'app'), { recursive: true });
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

function writePage(relPath: string, html: string) {
  const full = path.join(dir, '.next', 'server', 'app', relPath);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, html);
}

function run(args: string[]): { code: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync('node', [SCRIPT, ...args], { cwd: dir, encoding: 'utf8' });
    return { code: 0, stdout, stderr: '' };
  } catch (e: any) {
    return { code: e.status ?? 1, stdout: e.stdout ?? '', stderr: e.stderr ?? '' };
  }
}

describe('division-isolation-check.mjs --own main (F2-06 item D)', () => {
  it('passes a page linking to every division domain (that is the site\'s purpose)', () => {
    writePage('index.html', `
      <a href="https://cleaning.vigilservices.co.uk">Cleaning</a>
      <a href="https://security.vigilservices.co.uk">Security</a>
      <a href="https://care.vigilservices.co.uk">Care</a>
      <a href="https://staffing.vigilservices.co.uk">Staffing</a>
    `);
    const result = run(['--mode', 'built', '--own', 'main']);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('OK');
  });

  it('fails when any division phone appears, in any of its three forms', () => {
    writePage('contact.html', '<a href="tel:+442030986037">020 3098 6037</a>'); // cleaning
    const result = run(['--mode', 'built', '--own', 'main']);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('FOREIGN PHONE');
  });

  it('catches all four division phones, not just one', () => {
    writePage('a.html', '020 3098 6037'); // cleaning
    writePage('b.html', '020 3973 8892'); // security
    writePage('c.html', '020 3973 8886'); // care_services
    writePage('d.html', '020 3973 8887'); // care_staffing
    const result = run(['--mode', 'built', '--own', 'main']);
    expect(result.code).toBe(1);
    const failures = (result.stderr.match(/FOREIGN PHONE/g) ?? []).length;
    expect(failures).toBe(4);
  });

  it('excludes /admin output, same as every other --own mode', () => {
    writePage('admin/dashboard.html', '020 3098 6037');
    const result = run(['--mode', 'built', '--own', 'main']);
    expect(result.code).toBe(0);
  });

  it('does not regress the existing --own <division> behaviour: domains stay forbidden there', () => {
    writePage('index.html', '<a href="https://security.vigilservices.co.uk">Security</a>');
    const result = run(['--mode', 'built', '--own', 'cleaning']);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('FOREIGN DIVISION DOMAIN');
  });
});
