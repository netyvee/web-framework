import { describe, it, expect } from 'vitest';
import { resolveTheme, surfaceBg, SURFACES } from '../src/tokens/theme';

const brand = { bg: '#0a1628', text: '#ffffff', cta: '#4ecdc4', secondary: '#7fb2d4' };

describe('design-token theme resolver (V0.2 §4)', () => {
  it('maps brand.cta→accent, brand.bg→bg/onAccent, brand.text→text', () => {
    const t = resolveTheme(brand);
    expect(t.accent).toBe('#4ecdc4');
    expect(t.bg).toBe('#0a1628');
    expect(t.onAccent).toBe('#0a1628');
    expect(t.text).toBe('#ffffff');
    expect(t.secondary).toBe('#7fb2d4');
  });

  it('uses the estate base surface family when brand carries no overrides', () => {
    const t = resolveTheme(brand);
    expect(t.bgAlt).toBe(SURFACES.bgAlt);
    expect(t.bgCard).toBe(SURFACES.bgCard);
    expect(surfaceBg(t, 'deep')).toBe(SURFACES.bgDeep);
    expect(surfaceBg(t, 'default')).toBe('#0a1628');
  });

  it('honours per-site surface overrides', () => {
    const t = resolveTheme({ ...brand, bg_alt: '#111111' } as any);
    expect(t.bgAlt).toBe('#111111');
  });

  it('derives accentStrong deterministically (darker than accent) and rgba line-accent', () => {
    const t = resolveTheme(brand);
    expect(t.accentStrong).toMatch(/^#[0-9a-f]{6}$/);
    expect(t.accentStrong).not.toBe(t.accent);
    expect(t.lineAccent).toMatch(/^rgba\(/);
  });
});
