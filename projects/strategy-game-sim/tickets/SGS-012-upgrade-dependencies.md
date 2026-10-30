# SGS-012: Upgrade npm dependencies to current stable majors

- **Type**: Task
- **Component**: site
- **Milestone / criteria**: M2 / M2.10
- **Priority**: high
- **Risk**: high
  <!-- Framework major jumps (Next 12 -> 16, React 18 -> 19, TypeScript 4 -> 7) under the one public route
       /api/fight and every page; adjacent invariants S2, H1-H3, W1-W2 (behavior must not move). -->
- **LOC estimate**: ~20-35 (business logic: four `<Link>` call sites in `pages/index.js` and `components/layout.js`, two
  `tsconfig.json` options, and a small acceptance-harness fix for the cold-run flake; the rest is `package.json` and a
  regenerated `package-lock.json`)
- **Depends on**: none
- **On merge**: REPO.md `acceptanceHarness`: change "Needs Node 20+" to the Node floor this ticket sets (22.12+).
  design/M2.md: the designer switches the Recharts section from `2.15.4` to `3.10.1` and re-verifies its chart test
  selectors (`path.recharts-line-curve[data-series]`, `li.recharts-legend-item.inactive`) on 3.x; CONTEXT.md
  Decisions: delete the "Dependency upgrade (owner, 2026-10-30)" line. REPO.md `commands.*` are unchanged.
- **Source**: M2.10; owner request 2026-10-30 (upgrade before M2 so it can use the latest Recharts)

## Context

The repo is on Next 12 / React 18 / TypeScript 4.7, and M2 wants Recharts 3.x, which needs `@types/react` >= 18.2.25 and
TS >= 5.4. Upgrade everything to current stable first, with no behavior change in the WOTR simulator, `/api/fight`,
the landing page or the StarCraft page.

## Scope

Target versions (looked up with `npm view <pkg> version` on 2026-10-30; write them as caret ranges, let the lockfile pin):

| package | now | target |
|---|---|---|
| next | ^12.1.6 | ^16.4.3 |
| react, react-dom | ^18.2.0 | ^19.3.1 |
| bootstrap | ^5.1.3 | ^5.3.8 |
| classnames | ^2.3.1 | ^2.5.1 |
| typescript | ^4.7.4 | ^7.0.2 |
| @types/react | ^18.0.14 | ^19.3.0 |
| @types/react-dom (new; today only transitive) | none | ^19.3.0, in `devDependencies` |
| @types/node | ^18.0.0 | ^24 (respec 1: matches the Node 24.x production runtime on Vercel; not latest 26.x) |
| vitest | ^1.6.0 | ^5.0.5 |
| @playwright/test | ^1.64.1 | ^1.64.1 (already latest) |
| ajv | ^8.20.0 | ^8.20.0 (already latest) |

Install all targets in one `npm install` (a separate `vitest@5` install over an existing `vitest@1` tree fails with an
ERESOLVE on `vite`). Regenerate `package-lock.json` (today `lockfileVersion` 2). npm places a newly added
`@types/react-dom` in `dependencies`; move it to `devDependencies`.

Code changes found by a trial upgrade of `origin/main` (6013fcc) in a scratch copy:

1. `pages/index.js` (2 links) and `components/layout.js` (2 links): `<Link href=...><a ...>text</a></Link>` becomes
   `<Link href=... className=...>text</Link>`. Next 16 throws "Invalid `<Link>` with `<a>` child" at render, so `/` returns 500
   and the Playwright `webServer` readiness check on `/` times out, failing the whole acceptance run. `git grep -n -A1
   "<Link" -- pages components | grep -c "<a"` is 4 today and must be 0. The `<a className=utilStyles.colorInherit>` on the
   header link keeps its class on the `<Link>`. The StarCraft page's `<a onClick>` buttons are not `<Link>` children; leave them.
2. `tsconfig.json`: TS 7 rejects `target: "es5"` (TS5108) and `moduleResolution: "node"` (TS5108). Set `target` to
   `es2017` and `moduleResolution` to `bundler`. `next build` also rewrites `jsx` from `preserve` to `react-jsx`; commit the
   file as Next leaves it (re-run `next build` and check it is stable, no further diff).
3. Everything else built and passed in the trial with no source change: `npx tsc --noEmit`, `npm test` (57 tests),
   `next build` (Turbopack, all five routes), and `npm run acceptance` (208 of 209 on a cold first run; the remaining spec
   passed on rerun, see item 4). `pages/api/fight.ts` (`NextApiRequest`/`NextApiResponse`), `next/head`, `next/image`
   with fixed width/height, `useState`, `ajv/dist/2020` in `acceptance/fight-api-contract.spec.ts`, `vitest.config.ts`
   and `playwright.config.ts` need no change for the upgrade itself (item 4 may touch the harness). There is no `next.config.*`, no `getServerSideProps`/`getStaticProps`, no
   `useRouter`, no ESLint config.

4. (respec 1) Acceptance cold-run flake, fixed in this ticket. In the trial, on a cold full `npm run acceptance`, the
   `combat-simulator-battles.spec.ts` test "a valid submit posts battles and renders every results section with the response
   numbers" timed out in `waitForFight` (the `page.waitForResponse` for the `/api/fight` POST) after clicking Fight!; it
   passed on every rerun. The `beforeEach` there only does `page.goto('/apps/combat-simulator')` plus
   `waitForLoadState('networkidle')`, which does not guarantee React has hydrated the form under Next 16 dev with cold
   compiles and parallel workers, so a click can land on the server-rendered form with no submit handler. The implementer
   reproduces it, confirms the cause (pre-hydration click, or cold compile of `/api/fight` on first request), and fixes it in
   the harness: for example a shared helper in `acceptance/helpers.ts` that waits for a hydration signal before interacting,
   used by the combat-simulator specs that click Fight!, or a warm-up of `/`, `/apps/combat-simulator` and `/api/fight`
   before the suite (Playwright `globalSetup` or the `webServer` readiness URL in `playwright.config.ts`). If the only
   reliable signal needs a marker in the page (e.g. a `data-hydrated` attribute set in an effect), that is allowed as a
   test-only hook with no visible behavior change. This harness fix is a justified mechanical acceptance edit. It must not
   weaken any assertion: no expectation removed or loosened, no `test.skip`/`test.fixme`, no Playwright `retries`, no
   per-test timeout raise used as the fix.

Node: Next 16 needs Node >= 20.9 and Vitest 5 needs `^22.12 || ^24 || >=26`. Add `"engines": { "node": ">=22.12.0" }` to
`package.json` so the Vercel build (which honors `engines`) cannot select an older Node. No `.nvmrc`/`engines` exists today.
(respec 1) The Vercel project `wotr-combat-simulator` already runs Node 24.x (confirmed via the Vercel API), which satisfies
this floor; the project's Node setting is not changed.

Do not accept any change to an acceptance spec except a mechanical selector/API update that the upgrade forces, and the
flake fix in item 4; each such edit is listed in the PR description with the reason.

**Out of scope:** app-router migration (stay on the pages router); adding Recharts or any M2 code; `golang/` and its
create-react-app frontend; ESLint; new tests; converting `.js` pages to TypeScript; fixing the "gamign" typo, the Next.js
tutorial og-image URL or other legacy content; `strict` mode; behavior changes of any kind.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `npm ci` succeeds from the committed `package-lock.json`, and the lockfile is regenerated (`lockfileVersion` 3) with
      `next` resolving to 16.x, `react` and `react-dom` to 19.x, `typescript` to 7.x, `vitest` to 5.x.
- [ ] (respec 1) `package.json` `dependencies`/`devDependencies` match the target table, with `@types/node` at `^24`
      (lockfile resolves 24.x), `@types/react-dom` is in `devDependencies`, and `engines.node` is `>=22.12.0`.
- [ ] `npx next build` succeeds and lists `/`, `/apps/combat-simulator`, `/apps/starcraft-helper`, `/api/fight`.
- [ ] `npx tsc --noEmit` exits 0.
- [ ] `npm test` passes with the same 57 tests (no test removed, skipped or edited).
- [ ] (respec 1) Two consecutive full `npm run acceptance` runs, the first from a cold start (no `.next/` directory), are
      both green with all 209 specs passing on the first attempt; the PR description states both runs and their counts.
- [ ] (respec 1) The cold-run flake fix is in the harness: each edit under `acceptance/` or `playwright.config.ts` is
      justified in the PR description, and none weakens an assertion (no `expect` removed or loosened, no `test.skip` or
      `test.fixme`, no `retries` added, no test timeout raised as the fix). `git grep -nE "retries|test\.(skip|fixme)" --
      acceptance playwright.config.ts` prints nothing.
- [ ] (respec 1) The PR description names the root cause found for the "a valid submit posts battles" timeout (pre-hydration
      click, cold `/api/fight` compile, or other, with the evidence), and the fix addresses that cause rather than masking it.
- [ ] The OpenAPI contract check still passes: `npx playwright test fight-api-contract fight-api-spec-surface` is green and
      `docs/api/openapi.json` is unchanged.
- [ ] `git grep -n -A1 "<Link" -- pages components | grep -c "<a"` prints 0, and the landing page renders both app links as
      single anchors (no nested `<a>`), with the header link on app pages still going to `/`.
- [ ] No behavior change: `POST /api/fight` with the example request from `docs/api/openapi.json` returns the same status and
      response shape as on `main`; the combat simulator form, Fight! button and results, and the StarCraft Randomize buttons
      work when clicked through under `npm run dev`; no new browser console errors or React hydration warnings on `/`,
      `/apps/combat-simulator`, `/apps/starcraft-helper`.
- [ ] No `app/` directory is created and no `next.config.*` is added unless the build requires it (state why in the PR).
- [ ] The Vercel check "Vercel – wotr-combat-simulator" is green on the PR, building on Node 24.x.
- [ ] No INVARIANTS.md regressions (S2 links still present, H1-H3 and W1-W2 unchanged).

## Open questions

None.

## Re-spec 2026-10-30

- Underspecified: `@types/node` target, the Vercel Node version, and whether the cold-run acceptance flake blocks this ticket
  were left to the owner.
- Changed: `@types/node` is `^24` (production runs Node 24.x on Vercel; `engines.node >=22.12.0` stands); the flake is fixed
  here in the harness with two consecutive green full runs required and no assertion weakened; the Recharts 3.x selector
  re-check moved fully to On merge for the designer.
- Existing branch work: none yet; the trial findings (Link rewrites, tsconfig options, target table) all still stand.
