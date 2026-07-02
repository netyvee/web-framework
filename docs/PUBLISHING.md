# PUBLISHING — how sites consume @vigil/web-framework

## Mechanism (decided on evidence, W-FRAMEWORK-F1 / D-046)
**Git-tag pinning on this PUBLIC repo**, consumed as an npm git dependency:

```json
"dependencies": {
  "@vigil/web-framework": "github:netyvee/web-framework#v0.1.0"
}
```

with Next.js transpiling the shipped TypeScript source:

```js
// next.config.mjs
const nextConfig = { transpilePackages: ['@vigil/web-framework'], ... }
```

**Evidence for the decision** (what the site CIs can actually consume):
- The site repos deploy on Vercel with NO npm registry auth configured.
- GitHub Packages npm requires an auth token for `npm install` **even for public
  packages** — so the GitHub-Packages route would need an NPM_TOKEN added to every
  Vercel project (operator dashboard action per project) before any site could build.
- A git dependency on a PRIVATE repo equally needs credentials in the Vercel build.
- A git dependency on a PUBLIC repo installs anonymously — zero tokens, zero operator
  action, works in Vercel and GitHub Actions today.

**Safety of public visibility**: the framework contains generic rendering code only —
no secrets, no content, no business data, and (enforced by CI) no NAP/identity literal
of any division. The same code already ships to every visitor's browser in the sites'
public JS bundles. Nothing becomes knowable that was not already public.

**Reversal path (if the operator prefers private)**: flip the repo to private, create a
fine-grained read-only PAT (contents:read on netyvee/web-framework), add it to each
Vercel project as `GIT_CREDENTIALS`/npm auth per Vercel's private-git-deps doc, and keep
the identical `github:…#vX.Y.Z` pins. One-time operator action per project; no code
change. (Secrets-governance rule applies: register the token, fine-grained scope,
skip-on-empty injection — the BLOG_REPO_TOKEN lesson.)

## Ship-source model
The package ships raw `src/*.ts(x)` (`main: src/index.ts`) — there is no build/dist
step. Consumers transpile via `transpilePackages`. `next`/`react`/`react-dom` are
peerDependencies so the consumer's copies are used (no duplicate React).

## How a site pins / upgrades / rolls back
- **Pin**: exact tag in package.json (`#v0.1.0`) + committed package-lock.json. Never a
  branch reference — `#main` is FORBIDDEN (unpinned = uncontrolled propagation).
- **Upgrade**: change the tag, `npm install`, run the site's QA gates locally/CI, push.
  One site per commit — propagation is canary → soak → fleet, never simultaneous.
- **Rollback**: revert the pin commit (tag + lockfile go back together); Vercel
  redeploys the previous state. Framework tags are immutable — never move or delete a
  released tag.

## Emergency-fix propagation
1. Fix on `main`, tag `vX.Y.(Z+1)` (patch), release notes state the defect + affected
   versions.
2. Bump the WORST-AFFECTED site first (still one at a time), verify its gates, then the
   remaining consumers in risk order.
3. If a released tag is dangerously broken: publish the patch and bump consumers — do
   NOT delete the bad tag (pins must stay resolvable); mark it ❌ in the compatibility
   matrix (docs/SEMVER-POLICY.md).

## Private-package access (recorded alternative)
GitHub Packages npm (`npm.pkg.github.com`) remains the documented fallback if the
estate later wants registry semantics (dist-tags, `npm outdated`): requires per-project
tokens as above plus a `publishConfig.registry` field and a publish step in this repo's
CI. Not adopted now — token surface with no current benefit over git-tag pinning.
