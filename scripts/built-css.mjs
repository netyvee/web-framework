// The built stylesheet files of a Next build, wherever the bundler wrote them.
// Next 14/15 write `.next/static/css/*.css`; Next 16 (Turbopack) writes `.next/static/chunks/*.css`. Reading only the old location made
// `visual-completion-check` report "no clamp() in built CSS" on a Next 16 build that has it, and made `capture-baseline` record no CSS.
// Returns [{ name, file }] sorted by name so concatenation and hashing are deterministic.
import fs from 'node:fs';
import path from 'node:path';

export const BUILT_CSS_DIRS = [['.next', 'static', 'css'], ['.next', 'static', 'chunks']];

export function builtCssFiles(siteDir) {
  const out = [];
  for (const parts of BUILT_CSS_DIRS) {
    const dir = path.join(siteDir, ...parts);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.css')).sort()) out.push({ name: f, file: path.join(dir, f) });
  }
  return out;
}

export function readBuiltCss(siteDir) {
  return builtCssFiles(siteDir).map(({ file }) => fs.readFileSync(file, 'utf8')).join('');
}
