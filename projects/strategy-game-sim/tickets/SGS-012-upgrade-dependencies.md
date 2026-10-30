# SGS-012: Upgrade npm dependencies to current stable majors

- **Type**: Task
- **Component**: site
- **Milestone / criteria**: M2 / M2.10
- **Priority**: high
- **Risk**: high
  <!-- Framework major jumps (Next 12 -> 16, React 18 -> 19, TypeScript 4 -> 7) under the one public route
       /api/fight and every page; adjacent invariants S2, H1-H3, W1-W2 (behavior must not move). -->
- **LOC estimate**: ~20-30 (business logic: four `<Link>` call sites in `pages/index.js` and `components/layout.js`, two
  `tsconfig.json` options plus one `include` entry, two `.gitignore` lines, a `vitest.config.ts` -> `vitest.config.mts`
  rename; the rest is `package.json` and a regenerated `package-lock.json`)
- **Depends on**: none
- **On merge**: REPO.md `acceptanceHarness`: change "Needs Node 20+" to "Needs Node 24.x" (rework 1: engines pinned to 24.x).
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
   with fixed width/height, `useState`, `ajv/dist/2020` in `acceptance/fight-api-contract.spec.ts`, and
   `playwright.config.ts` need no change (`vitest.config.ts` content is unchanged; item 5c only renames it). There is no `next.config.*`, no `getServerSideProps`/`getStaticProps`, no
   `useRouter`, no ESLint config.

4. (respec 2) Acceptance cold-run flake: no harness change. The trial saw one cold-run timeout in
   `combat-simulator-battles.spec.ts` ("a valid submit posts battles and renders every results section with the response
   numbers", in `waitForFight` after clicking Fight!). On the branch it did not reproduce: 8 cold full runs (209/209 each),
   3 cold full runs under 16 CPU-burning processes, 3 runs in the trial's order (fresh `next build` then `npm run
   acceptance`), one cold `--repeat-each=10` run (2090/2090), Fight! clicked as soon as visible with Chromium CPU throttling
   at 1x/10x/40x (every click posted to `/api/fight`), and the first cold `/api/fight` request answered in 82 ms. The PR
   description records these attempts and that evidence. Nothing under `acceptance/` or in `playwright.config.ts` changes
   for the flake; a future recurrence gets its own ticket.
5. (respec 2) Upgrade-caused repo hygiene:
   a. `next-env.d.ts`: Next 16 rewrites this tracked file on every `next build` (imports `./.next/types/...`) and `next dev`
      (imports `./.next/dev/types/...`). Untrack it (`git rm --cached next-env.d.ts`) and add `next-env.d.ts` to
      `.gitignore`. `npx tsc --noEmit` passes without the file (checked on the branch at 7ab5aee); `tsconfig.json` keeps
      `next-env.d.ts` in `include` (Next manages that entry).
   b. `AGENTS.md`: `next dev` writes it at the repo root when it detects an AI coding agent (`syncAgentRulesForDev` in
      `node_modules/next/dist/server/lib/app-info-log.js`). Add `/AGENTS.md` to `.gitignore`; do not commit the file.
   c. Vitest 5 config warning: `npm test` prints "(!) Your Vite config uses features that are unsupported by
      `configLoader: 'native'` ... ESM syntax in a file loaded as CommonJS (vitest.config.ts:1:1)" because `package.json`
      has no `"type": "module"`. Rename `vitest.config.ts` to `vitest.config.mts` (`git mv`, content unchanged); do not set
      `"type": "module"`. `tsconfig.json` `include` matches only `**/*.ts`, `**/*.tsx`, so add `"**/*.mts"` to keep the
      config type-checked (checked: `tsc --noEmit` exits 0 and lists `vitest.config.mts`). No other file references
      `vitest.config.ts` (`git grep -n "vitest.config"` finds only the file's own import line; REPO.md `commands.unit` is
      `npm test` and needs no change).

Node: Next 16 needs Node >= 20.9 and Vitest 5 needs `^22.12 || ^24 || >=26`. (rework 1) Add `"engines": { "node": "24.x" }` to
`package.json`: Vercel honors `engines` over the project setting, and an open range (`>=22.12.0`) made it build on Node 26.x and
auto-upgrade on each new major (owner, 2026-10-30: pin production to 24.x). No `.nvmrc`/`engines` exists today.
(respec 1) The Vercel project `wotr-combat-simulator` already runs Node 24.x (confirmed via the Vercel API), which satisfies
this floor; the project's Node setting is not changed.

Do not accept any change to an acceptance spec or `playwright.config.ts` except a mechanical selector/API update that the
upgrade forces (none was needed on the branch); each such edit is listed in the PR description with the reason.

**Out of scope:** app-router migration (stay on the pages router); adding Recharts or any M2 code; `golang/` and its
create-react-app frontend; ESLint; new tests; converting `.js` pages to TypeScript; fixing the "gamign" typo, updating `ARCHITECTURE.md` "Stack" (SGS-023), the Next 16 dev-only
`scroll-behavior: smooth` log message, the Next.js
tutorial og-image URL or other legacy content; `strict` mode; behavior changes of any kind.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [x] `npm ci` succeeds from the committed `package-lock.json`, and the lockfile is regenerated (`lockfileVersion` 3) with
      `next` resolving to 16.x, `react` and `react-dom` to 19.x, `typescript` to 7.x, `vitest` to 5.x.
- [x] (respec 1) `package.json` `dependencies`/`devDependencies` match the target table, with `@types/node` at `^24`
      (lockfile resolves 24.x), `@types/react-dom` is in `devDependencies`, and (rework 1) `engines.node` is `24.x`.
- [x] `npx next build` succeeds and lists `/`, `/apps/combat-simulator`, `/apps/starcraft-helper`, `/api/fight`.
- [x] `npx tsc --noEmit` exits 0.
- [x] `npm test` passes with the same 57 tests (no test removed, skipped or edited).
- [x] (respec 1) Two consecutive full `npm run acceptance` runs, the first from a cold start (no `.next/` directory), are
      both green with all 209 specs passing on the first attempt; the PR description states both runs and their counts.
- [x] (respec 2) No file under `acceptance/` or `playwright.config.ts` changes for the flake, and `git grep -nE
      "retries|test\.(skip|fixme)" -- acceptance playwright.config.ts` prints nothing.
- [ ] (respec 2) The PR description records the cold-run flake reproduction attempts and evidence from item 4 (8 cold full
      runs, CPU-loaded runs, `--repeat-each=10`, throttled clicks, cold `/api/fight` latency) and states that no harness
      change was made for it.
- [x] (respec 2) `git ls-files next-env.d.ts` prints nothing, `.gitignore` lists `next-env.d.ts`, `npx next build` and
      `npm run dev` each regenerate `next-env.d.ts` without it showing in `git status`, and `npx tsc --noEmit` exits 0 both
      with and without the file present.
- [x] (respec 2) `.gitignore` lists `/AGENTS.md`; after an `npm run dev` or `npm run acceptance` run, `git status --porcelain`
      shows no `AGENTS.md`, and `git ls-files AGENTS.md` prints nothing.
- [x] (respec 2) `vitest.config.ts` is renamed to `vitest.config.mts` with unchanged content, `tsconfig.json` `include` has
      `"**/*.mts"`, `npm test` output contains no "loaded as CommonJS" warning (`npm test 2>&1 | grep -c "CommonJS"` prints
      0; 1 today), and `npx tsc --listFilesOnly | grep -c vitest.config.mts` prints 1.
- [x] The OpenAPI contract check still passes: `npx playwright test fight-api-contract fight-api-spec-surface` is green and
      `docs/api/openapi.json` is unchanged.
- [x] `git grep -n -A1 "<Link" -- pages components | grep -c "<a"` prints 0, and the landing page renders both app links as
      single anchors (no nested `<a>`), with the header link on app pages still going to `/`.
- [x] No behavior change: `POST /api/fight` with the example request from `docs/api/openapi.json` returns the same status and
      response shape as on `main`; the combat simulator form, Fight! button and results, and the StarCraft Randomize buttons
      work when clicked through under `npm run dev`; no new browser console errors or React hydration warnings on `/`,
      `/apps/combat-simulator`, `/apps/starcraft-helper`.
- [x] No `app/` directory is created and no `next.config.*` is added unless the build requires it (state why in the PR).
- [ ] (rework 1) The Vercel check "Vercel – wotr-combat-simulator" is green on the PR, and its build log shows Node 24.x with no
      "Project Settings ... will not apply" override warning.
- [x] No INVARIANTS.md regressions (S2 links still present, H1-H3 and W1-W2 unchanged).

## Open questions

None.

## Re-spec 2026-10-30

- Underspecified: `@types/node` target, the Vercel Node version, and whether the cold-run acceptance flake blocks this ticket
  were left to the owner.
- Changed: `@types/node` is `^24` (production runs Node 24.x on Vercel; `engines.node >=22.12.0` stands); the flake is fixed
  here in the harness with two consecutive green full runs required and no assertion weakened; the Recharts 3.x selector
  re-check moved fully to On merge for the designer.
- Existing branch work: none yet; the trial findings (Link rewrites, tsconfig options, target table) all still stand.

## Re-spec 2026-10-30 (2)

- Underspecified: the flake criterion required a root cause the implementer could not reproduce (no failure in 8 cold
  runs, CPU-loaded runs, `--repeat-each=10`, throttled clicks); the upgrade's side effects on tracked/generated files
  were not covered.
- Changed (owner answers): flake root-cause/fix criteria dropped in favor of recording the evidence in the PR, no harness
  change; added `next-env.d.ts` untracking, `/AGENTS.md` gitignore, and the `vitest.config.mts` rename with a `**/*.mts`
  tsconfig include.
- Existing branch work at 7ab5aee stands in full (deps, lockfile, Link rewrites, tsconfig, engines); the implementer adds
  item 5 on top and pushes for the Vercel check.

## Rework 1 - 2026-10-30 (tech-lead)

Bounced by tech-lead on draft PR #24 (branch tip 623a5ff; review, acceptance-test and suite passed at 623a5ff).

Findings:
- `package.json:8-10`: `"engines": { "node": ">=22.12.0" }` makes Vercel ignore the project's Node 24.x setting. Preview build log
  (deployment 6QcYLshqg6kqY7f4hVnK1pm1BZ9X): "the Node.js Version defined in your Project Settings ("24.x") will not apply,
  Node.js Version "26.x" will be used instead", and the range auto-upgrades on each new Node major. No gate ran on Node 26.

Required fixes:
- [x] Set `engines.node` to `"24.x"` (owner decision 2026-10-30). The only lockfile change allowed is the root
      package entry's `engines` field (run `npm install --package-lock-only`); no resolved version changes.
- [x] `npm ci` (local Node 22 prints an EBADENGINE warning only, since `engine-strict` is unset; confirm it still installs),
      `npx tsc --noEmit`, `npm test` pass on the branch.
- [ ] Push is done by the manager/tech-lead; after the push the Vercel log must show Node 24.x with no override warning.
