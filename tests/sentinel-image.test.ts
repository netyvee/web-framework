// F2-06 item A (netyvee/app#344) — shared sentinel-image contract, lifted from
// the identical guard netyvee/vigil-cleaning and netyvee/security each
// independently built (UNASSIGNED_IMAGE_SRC / hasAssignedImage, #1519).
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SENTINEL_IMAGE_PATH, isSentinelImage } from '../src/types';

describe('SENTINEL_IMAGE_PATH / isSentinelImage', () => {
  it('is the exact literal every current consumer already hardcodes', () => {
    expect(SENTINEL_IMAGE_PATH).toBe('/placeholder-image.svg');
  });

  it('recognises the sentinel as a bare string', () => {
    expect(isSentinelImage('/placeholder-image.svg')).toBe(true);
  });

  it('recognises the sentinel on the object form\'s url field', () => {
    expect(isSentinelImage({ url: '/placeholder-image.svg' })).toBe(true);
  });

  it('returns false for a real image, string or object form', () => {
    expect(isSentinelImage('/images/real-photo.jpg')).toBe(false);
    expect(isSentinelImage({ url: '/images/real-photo.jpg' })).toBe(false);
  });

  it('returns false for null/undefined without throwing', () => {
    expect(isSentinelImage(null)).toBe(false);
    expect(isSentinelImage(undefined)).toBe(false);
  });

  it('returns false for an object with no url at all', () => {
    expect(isSentinelImage({ alt: 'no url set' })).toBe(false);
  });
});

// scripts/verify-no-leaked-sentinel.mjs runs standalone via plain `node` (no TS
// loader), so it can't import SENTINEL_IMAGE_PATH from src/types.ts — it carries
// its own literal copy instead (DEFAULT_SENTINEL). This test is the thing that
// actually keeps the two in sync, backing up that script's own comment claiming it.
describe('verify-no-leaked-sentinel.mjs default literal stays in sync', () => {
  it('matches SENTINEL_IMAGE_PATH exactly', () => {
    const scriptPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../scripts/verify-no-leaked-sentinel.mjs');
    const src = fs.readFileSync(scriptPath, 'utf8');
    const match = src.match(/const DEFAULT_SENTINEL = '([^']+)'/);
    expect(match).not.toBeNull();
    expect(match![1]).toBe(SENTINEL_IMAGE_PATH);
  });
});
