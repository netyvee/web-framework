// Types for config/security.mjs (shipped as .mjs — consumed by next.config.mjs).
import type { NextConfig } from 'next';

export interface VigilCspOptions {
  /** default: process.env.NODE_ENV === 'production' */
  isProduction?: boolean;
  /** extra img-src hosts (merged with 'self', Cloudinary, data:) */
  imgHosts?: string[];
  /** extra form-action origins (merged with 'self' + the CRM origin) */
  formActions?: string[];
  /** extra connect-src hosts (merged with 'self') */
  connectHosts?: string[];
}

export interface SecurityHeader {
  key: string;
  value: string;
}

export function vigilCsp(o?: VigilCspOptions): string;
export function vigilSecurityHeaders(o?: VigilCspOptions): SecurityHeader[];
export function withVigilSecurity(nextConfig?: NextConfig, o?: VigilCspOptions): NextConfig;
