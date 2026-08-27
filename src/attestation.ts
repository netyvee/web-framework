// WEBSITE-DEPLOYMENT-ATTESTATION-01 (netyvee/app#344) — a shared, reusable Next.js
// Route Handler for the `/.well-known/vigil-deployment.json` deployment-attestation
// contract, so every framework-adopted site (Care, Staffing, Main, and eventually
// Security once it's on the framework) wires the SAME logic rather than each
// hand-copying it (the way netyvee/vigil-cleaning#4 had to, being off-framework).
//
// A stable, non-secret surface reporting exactly what the LIVE deployment is
// serving, so the CRM (DeploymentVerificationService::verifyAttestation()) can
// require an exact commit-SHA match instead of inferring success from a GitHub
// commit or a Vercel deployment merely existing. Sourced entirely from Vercel's
// own build-time env vars — no secrets, tokens, customer data or mutable DB state.
//
// Deliberately NO site-specific defaults/config: every field falls back to `null`
// when its source env var is absent (off-Vercel, local dev) rather than guessing
// a repo identity — a fail-closed shape the CRM's polling can still parse, and one
// that is byte-identical logic for every consumer regardless of which site it is.
//
// force-dynamic + no-store: this must always reflect the CURRENT deployment at
// request time, never a cached response — caching would defeat the entire point.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export function buildAttestationPayload() {
  return {
    git_sha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    git_ref: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    environment: process.env.VERCEL_TARGET_ENV ?? process.env.VERCEL_ENV ?? null,
    repo_owner: process.env.VERCEL_GIT_REPO_OWNER ?? null,
    repo_slug: process.env.VERCEL_GIT_REPO_SLUG ?? null,
    deployment_url: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    production_url: process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : null,
  };
}

export async function GET() {
  // Response is a web-standard global (available in the Next.js Route Handler
  // runtime) — using it directly here, rather than next/server's NextResponse,
  // keeps this module framework-import-free so it never risks pulling
  // next/server into a caller's client bundle by accident.
  return new Response(JSON.stringify(buildAttestationPayload()), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store, must-revalidate',
    },
  });
}
