// @vigil/web-framework — shared Next.js security headers + config wrapper.
//
// Consumed directly from a site's `next.config.mjs`. It ships as plain ESM (`.mjs`,
// outside `src/`) on purpose: Next loads `next.config.mjs` through Node's own module
// loader, which does NOT strip TypeScript types under `node_modules` — the same rule
// that governs `scripts/*.mjs` and `a11y/*.mjs`. A `.ts` helper could not be imported
// by a pinned consumer's config. It is therefore also outside the `--mode src`
// isolation scan; the only external hosts named here are cross-division shared infra
// (the CRM enquiry origin + the Cloudinary image store), never a division identity.
//
// Usage (staffing/care/cleaning/security):
//   import { withVigilSecurity } from '@vigil/web-framework/config/security.mjs';
//   const nextConfig = { trailingSlash: false, async redirects() { return [...]; } };
//   export default withVigilSecurity(nextConfig);
//
// Or compose the pieces:
//   import { vigilSecurityHeaders, vigilCsp } from '@vigil/web-framework/config/security.mjs';

// Cross-division shared infrastructure (NOT division identity — safe framework defaults):
const CRM_ORIGIN = 'https://app.vigilservices.co.uk'; // canonical enquiry/CRM origin (all four businesses)
const IMAGE_STORE = 'https://res.cloudinary.com';     // canonical Cloudinary image store

/**
 * Build the Vigil Content-Security-Policy string.
 *
 * The framework renders with inline `style={}` and Next injects an inline hydration
 * bootstrap, so `'unsafe-inline'` is required for style-src/script-src until a
 * nonce-based CSP lands (tracked follow-up). Next's dev server evals for Fast
 * Refresh/HMR, so `'unsafe-eval'` is added in development ONLY — production
 * (`next build`/`next start`) never evals and its CSP stays strict.
 *
 * @param {object}  [o]
 * @param {boolean} [o.isProduction]  default: NODE_ENV === 'production'
 * @param {string[]}[o.imgHosts]      extra img-src hosts (merged with self/data:/Cloudinary)
 * @param {string[]}[o.formActions]   extra form-action origins (merged with self + CRM)
 * @param {string[]}[o.connectHosts]  extra connect-src hosts (merged with self)
 * @returns {string} the assembled CSP header value
 */
export function vigilCsp(o = {}) {
  const isProduction = o.isProduction ?? process.env.NODE_ENV === 'production';
  const scriptSrc = isProduction
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

  const imgHosts = ["'self'", IMAGE_STORE, 'data:', ...(o.imgHosts ?? [])];
  const formActions = ["'self'", CRM_ORIGIN, ...(o.formActions ?? [])];
  const connectHosts = ["'self'", ...(o.connectHosts ?? [])];

  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${dedupe(imgHosts).join(' ')}`,
    "font-src 'self' data:",
    `connect-src ${dedupe(connectHosts).join(' ')}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    `form-action ${dedupe(formActions).join(' ')}`,
    "object-src 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
}

/**
 * The full Vigil security-header set as a Next `headers()` value array.
 * @param {object} [o] forwarded to {@link vigilCsp}
 * @returns {{key: string, value: string}[]}
 */
export function vigilSecurityHeaders(o = {}) {
  return [
    { key: 'Content-Security-Policy', value: vigilCsp(o) },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
    { key: 'X-DNS-Prefetch-Control', value: 'on' },
  ];
}

/**
 * Wrap a Next config so every route serves the Vigil security headers. Any
 * `headers()` the consumer already defined is preserved and merged AFTER the
 * security rule (later entries win per-header in Next), so a site can still
 * override an individual header for a specific path. All other config (redirects,
 * images, transpilePackages, …) passes through untouched.
 *
 * @param {import('next').NextConfig} [nextConfig]
 * @param {object} [o] forwarded to {@link vigilCsp}
 * @returns {import('next').NextConfig}
 */
export function withVigilSecurity(nextConfig = {}, o = {}) {
  const existingHeaders = nextConfig.headers;
  return {
    ...nextConfig,
    async headers() {
      const base = [{ source: '/:path*', headers: vigilSecurityHeaders(o) }];
      const extra = typeof existingHeaders === 'function' ? await existingHeaders() : [];
      return [...base, ...(Array.isArray(extra) ? extra : [])];
    },
  };
}

function dedupe(list) {
  return [...new Set(list)];
}
