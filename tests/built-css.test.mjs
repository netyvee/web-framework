// v1.25.2 - the built CSS is found in both the Next 14/15 and the Next 16 output locations.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { builtCssFiles, readBuiltCss } from '../scripts/built-css.mjs';

const mk = (files) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vf-css-'));
  for (const [rel, body] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), body);
  }
  return dir;
};

describe('built CSS locator', () => {
  it('Next 14/15 layout: .next/static/css/*.css', () => {
    const d = mk({ '.next/static/css/a.css': 'a{font-size:clamp(1rem,2vw,2rem)}', '.next/static/css/ignore.txt': 'x' });
    expect(builtCssFiles(d).map((f) => f.name)).toEqual(['a.css']);
    expect(readBuiltCss(d)).toMatch(/clamp\(/);
  });
  it('Next 16 layout: .next/static/chunks/*.css (the clamp() rules live there)', () => {
    const d = mk({ '.next/static/chunks/1-abc.css': 'h1{font-size:clamp(1rem,2vw,2rem)}', '.next/static/chunks/app.js': 'x' });
    expect(builtCssFiles(d).map((f) => f.name)).toEqual(['1-abc.css']);
    expect(readBuiltCss(d)).toMatch(/clamp\(/);
  });
  it('both locations are read, in a deterministic order (css dir first, each sorted)', () => {
    const d = mk({ '.next/static/chunks/z.css': 'z{}', '.next/static/css/b.css': 'b{}', '.next/static/css/a.css': 'a{}' });
    expect(builtCssFiles(d).map((f) => f.name)).toEqual(['a.css', 'b.css', 'z.css']);
    expect(readBuiltCss(d)).toBe('a{}b{}z{}');
  });
  it('no build output: no files, empty string, no throw', () => {
    const d = mk({ 'README.md': 'x' });
    expect(builtCssFiles(d)).toEqual([]);
    expect(readBuiltCss(d)).toBe('');
  });
});
