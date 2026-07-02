// @vigil/web-framework — runtime THEME resolver (v0.2).
// Colour is per-site and per-page: it is resolved from page.brand (the CRM-owned
// registry value) at render time — NEVER a literal in a component (DESIGN-SYSTEM-
// CONTRACT §4; SECTION-LIBRARY "no site-specific literals"). Components call
// resolveTheme(page.brand) and read t.* inline, exactly the mechanism the nucleus
// sections use (page.brand inline styles) — so v0.2 components drop into any
// consumer with zero global-CSS colour dependency.

import type { PageJson } from '../types';

type Brand = PageJson['brand'] & {
  // optional per-site surface overrides (a future non-navy site sets these;
  // absent ⇒ the estate base surface family below)
  bg_alt?: string;
  bg_card?: string;
  bg_deep?: string;
  bg_footer?: string;
};

// Estate BASE surface family (DESIGN-SYSTEM-CONTRACT §1). This is the shared
// "surface hierarchy" token (framework base, §4) — no single division owns these
// values; all four divisions render navy today. Overridable per site via Brand.
export const SURFACES = {
  bgAlt: '#0d1a2d',
  bgCard: '#0f1f36',
  bgDeep: '#060e1a',
  footer: '#0f1f3d',
} as const;

// White-on-dark text emphasis ladder (all Vigil sites use light text on a dark
// surface; documented assumption).
const TEXT_LADDER = {
  text2: 'rgba(255,255,255,0.75)',
  text3: 'rgba(255,255,255,0.55)',
  text4: 'rgba(255,255,255,0.45)',
  text5: 'rgba(255,255,255,0.35)',
  line: 'rgba(255,255,255,0.08)',
} as const;

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

// Deterministic hex helpers (no colour-lib dependency).
function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const int = parseInt(m[1], 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}
function darken(hex: string, amount: number): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const [r, g, b] = rgb.map((c) => clampByte(c * (1 - amount)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
function rgba(hex: string, alpha: number): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

export type Theme = {
  bg: string;
  bgAlt: string;
  bgCard: string;
  bgDeep: string;
  footer: string;
  text: string;
  text2: string;
  text3: string;
  text4: string;
  text5: string;
  accent: string;
  accentStrong: string;
  onAccent: string;
  secondary: string;
  line: string;
  lineAccent: string;
  // CSS custom properties to spread on the page root so tokens.css + focus rings
  // resolve per-page (e.g. --vf-focus). Purely additive.
  cssVars: Record<string, string>;
};

export type Surface = 'default' | 'alt' | 'card' | 'deep' | 'footer';

export function resolveTheme(brand: Brand): Theme {
  const accent = brand.cta;
  const t: Theme = {
    bg: brand.bg,
    bgAlt: brand.bg_alt ?? SURFACES.bgAlt,
    bgCard: brand.bg_card ?? SURFACES.bgCard,
    bgDeep: brand.bg_deep ?? SURFACES.bgDeep,
    footer: brand.bg_footer ?? SURFACES.footer,
    text: brand.text,
    text2: TEXT_LADDER.text2,
    text3: TEXT_LADDER.text3,
    text4: TEXT_LADDER.text4,
    text5: TEXT_LADDER.text5,
    accent,
    accentStrong: darken(accent, 0.12),
    onAccent: brand.bg,
    secondary: brand.secondary,
    line: TEXT_LADDER.line,
    lineAccent: rgba(accent, 0.15),
    cssVars: {
      '--vf-focus': accent,
      '--vf-accent': accent,
    },
  };
  return t;
}

// Surface colour lookup for a section's declared surface (SECTION-LIBRARY: every
// section may declare a surface; defaults chosen per component).
export function surfaceBg(t: Theme, surface: Surface = 'default'): string {
  switch (surface) {
    case 'alt': return t.bgAlt;
    case 'card': return t.bgCard;
    case 'deep': return t.bgDeep;
    case 'footer': return t.footer;
    default: return t.bg;
  }
}
