import { describe, it, expect } from 'vitest';
// The helper ships as .mjs (consumed by next.config.mjs — see config/security.mjs header).
import { vigilCsp, vigilSecurityHeaders, withVigilSecurity } from '../config/security.mjs';

describe('withVigilSecurity — shared Next security headers (EOS Q1.P2)', () => {
  it('emits the full Vigil security-header set', () => {
    const headers = vigilSecurityHeaders({ isProduction: true });
    const byKey = Object.fromEntries(headers.map((h) => [h.key, h.value]));
    expect(byKey['X-Content-Type-Options']).toBe('nosniff');
    expect(byKey['X-Frame-Options']).toBe('DENY');
    expect(byKey['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(byKey['Strict-Transport-Security']).toBe('max-age=63072000; includeSubDomains; preload');
    expect(byKey['Permissions-Policy']).toContain('interest-cohort=()');
    expect(byKey['X-DNS-Prefetch-Control']).toBe('on');
    expect(byKey['Content-Security-Policy']).toBeTruthy();
  });

  it('production CSP is strict (no unsafe-eval); dev CSP adds unsafe-eval for HMR', () => {
    const prod = vigilCsp({ isProduction: true });
    const dev = vigilCsp({ isProduction: false });
    expect(prod).toContain("script-src 'self' 'unsafe-inline'");
    expect(prod).not.toContain('unsafe-eval');
    expect(dev).toContain("'unsafe-eval'");
  });

  it('CSP allows the shared CRM form-action + Cloudinary/data image sources by default', () => {
    const csp = vigilCsp({ isProduction: true });
    expect(csp).toContain("form-action 'self' https://app.vigilservices.co.uk");
    expect(csp).toContain('img-src');
    expect(csp).toContain('https://res.cloudinary.com');
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain('upgrade-insecure-requests');
  });

  it('merges extra hosts without duplicating the defaults', () => {
    const csp = vigilCsp({ isProduction: true, imgHosts: ['https://res.cloudinary.com', 'https://cdn.example'] });
    // Cloudinary appears once despite being passed again; the extra host is present.
    expect(csp.match(/https:\/\/res\.cloudinary\.com/g)).toHaveLength(1);
    expect(csp).toContain('https://cdn.example');
  });

  it('scriptHosts adds external script origins to script-src only (v0.6.4)', () => {
    const base = vigilCsp({ isProduction: true });
    expect(base).toContain("script-src 'self' 'unsafe-inline'");
    expect(base).not.toContain('googletagmanager');
    const csp = vigilCsp({ isProduction: true, scriptHosts: ['https://www.googletagmanager.com'] });
    expect(csp).toMatch(/script-src 'self' 'unsafe-inline' https:\/\/www\.googletagmanager\.com/);
    // it must NOT leak into other directives
    expect(csp).not.toMatch(/connect-src[^;]*googletagmanager/);
    expect(csp).not.toMatch(/img-src[^;]*googletagmanager/);
  });

  it('withVigilSecurity injects a /:path* headers rule and preserves passthrough config', async () => {
    const wrapped = withVigilSecurity({ trailingSlash: false, images: { formats: ['image/webp'] } }, { isProduction: true });
    expect(wrapped.trailingSlash).toBe(false);
    expect(wrapped.images).toEqual({ formats: ['image/webp'] });
    const rules = await wrapped.headers!();
    expect(rules[0].source).toBe('/:path*');
    expect(rules[0].headers.some((h) => h.key === 'Content-Security-Policy')).toBe(true);
  });

  it("preserves a consumer's own headers() after the security rule", async () => {
    const custom = { source: '/special', headers: [{ key: 'X-Special', value: '1' }] };
    const wrapped = withVigilSecurity({ async headers() { return [custom]; } }, { isProduction: true });
    const rules = await wrapped.headers!();
    expect(rules).toHaveLength(2);
    expect(rules[0].source).toBe('/:path*');
    expect(rules[1]).toEqual(custom);
  });
});
