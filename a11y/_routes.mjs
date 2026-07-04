/**
 * Interior-route contract for the shared §14 WCAG 2.2 AA a11y suite.
 *
 * The suite is division-agnostic — the homepage ('/') is universal, but the interior
 * render paths (service / location / article pages) differ per site. Each consuming
 * site declares its own interior routes via env vars in its `playwright.config.ts`
 * (see README.md). Unset routes fall back to '/' so the suite still RUNS (re-testing
 * the homepage) rather than 404-ing — configure them for real interior coverage.
 *
 * This is the a11y analog of `scripts/perf-budget.mjs`'s BASE_URL/--routes contract:
 * the shared harness lives in the framework; the site supplies the routes. Shipped as
 * plain ESM (.mjs) so it runs directly from a consumer's node_modules pin — Node does
 * not strip TypeScript types under node_modules.
 */
export const SERVICE_PATH = process.env.A11Y_SERVICE_PATH ?? '/';
export const LOCATION_PATH = process.env.A11Y_LOCATION_PATH ?? '/';
export const ARTICLE_PATH = process.env.A11Y_ARTICLE_PATH ?? '/';
