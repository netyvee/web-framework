// Extracted verbatim from netyvee/care lib/pages/loader.ts (identical in
// netyvee/staffing) — F1.2. Types moved to types.ts; behaviour unchanged.
import fs from 'fs';
import path from 'path';
import type { PageJson, ImageRef } from './types';

const DIR = path.join(process.cwd(), 'content/pages');

export function getPageSlugs(): string[] {
  if (!fs.existsSync(DIR)) return [];
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
    .map((f) => f.replace(/\.json$/, ''));
}

export function getPage(slugFile: string): PageJson | null {
  const fp = path.join(DIR, `${slugFile}.json`);
  if (!fs.existsSync(fp)) return null;
  return JSON.parse(fs.readFileSync(fp, 'utf8')) as PageJson;
}

// slug path segments (["a","b"]) <-> file name ("a__b"); homepage <-> "index"
export const paramsToFile = (parts: string[]) =>
  parts && parts.length ? parts.join('__') : 'index';

// Canonical image contract readers: a slot image is the canonical object OR a
// legacy bare URL string. These read either shape (one interpretation) so render
// never breaks on the shape.
export function imgSrc(image: ImageRef): string | null {
  if (!image) return null;
  if (typeof image === 'string') return image;
  return image.url ?? null;
}

export function imgAlt(image: ImageRef, siblingAlt?: string): string {
  if (image && typeof image === 'object' && image.alt) return image.alt;
  return siblingAlt ?? '';
}
