# SGS-012 review 1

Verdict: **APPROVE**

- Branch `sgs-012-upgrade-dependencies`, tip 623a5ff (not pushed), base origin/main 6013fcc. Full review.
- Reviewed in a detached worktree `worktrees/review-sgs-012-upgrade-dependencies` at 623a5ff, removed afterwards.
- Node v22.17.0.

## Blocking findings

None.

## Spec gaps

None.

## Acceptance criteria

I re-ran every check myself in the review worktree. I did not rely on the implementer's numbers.

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | `npm ci` works, lockfile v3 | pass | `npm ci` gave 0 vulnerabilities. Lockfile v3, root name `WOTR_Combat_Simulator`. Resolved: next 16.4.3, react/react-dom 19.3.1, typescript 7.0.2, vitest 5.0.5. Every `resolved` URL is on registry.npmjs.org. |
| 2 | package.json matches the table | pass | Every range matches the target table. `@types/node ^24` resolves to 24.19.2. `@types/react-dom` is in devDependencies. `engines.node` is `>=22.12.0`. |
| 3 | `next build` | pass | Lists `/`, `/404`, `/api/fight`, `/apps/combat-simulator`, `/apps/starcraft-helper`. A rebuild leaves `tsconfig.json` unchanged. |
| 4 | `tsc --noEmit` | pass | Exit 0 in three states: no `next-env.d.ts`; `next-env.d.ts` present after a build; `next-env.d.ts` present but `.next/` removed. |
| 5 | `npm test` | pass | 57/57 in 4 files. No test files in the diff. |
| 6 | Two acceptance runs, the first cold | pass | Cold run (`.next` and `next-env.d.ts` removed): 209 passed. Second run: 209 passed. Neither log has a flaky or retry line. |
| 7 | No acceptance or Playwright config changes, no retries/skip | pass | `git diff 6013fcc` touches nothing under `acceptance/` or in `playwright.config.ts`. The grep prints nothing. |
| 8 | PR description records the flake evidence | **unchecked** | There is no PR yet. The draft in `SGS-012-implementer-2.md` covers every item from scope item 4 and has no ticket ids. Tech-lead must use that draft. |
| 9 | `next-env.d.ts` untracked and ignored | pass | `git ls-files` prints nothing and `.gitignore` lists it. `next build` and `next dev` each regenerated it, and `git status --porcelain` stayed empty. |
| 10 | `/AGENTS.md` ignored | pass | `next dev` and acceptance both wrote `AGENTS.md`, and `git status --porcelain` stayed empty. It is not tracked. |
| 11 | `vitest.config.mts` rename | pass | 100% rename. `include` has `**/*.mts`. `npm test 2>&1 \| grep -ciE "commonjs\|warn"` gives 0. `tsc --listFilesOnly \| grep -c vitest.config.mts` gives 1. `git grep vitest.config` finds only the file's own import. |
| 12 | OpenAPI contract | pass | Both contract specs were part of the two 209/209 runs. `docs/api/openapi.json` is unchanged. |
| 13 | No `<a>` inside `<Link>`, single anchors, header link goes to `/` | pass | The grep gives 0. In a Chromium click-through there is no `a a` on any of the three pages. The landing links go to `/apps/combat-simulator` and `/apps/starcraft-helper`. Clicking the header `h2` link navigated to `/`. |
| 14 | No behavior change | pass | Checked with curl against `next dev`. The OpenAPI example returns 200 with keys battles/hitsPerRound/outcomes/rounds/survivors and outcomes attacker/defender/tie. GET returns 405 `{error}`. Malformed JSON returns a plain-text 400 "Invalid JSON", the same exception the spec already notes. A 0-unit attacker returns 400 `{error}`. In the browser, Fight! posts and gets 200, and every results section renders. Both StarCraft Randomize buttons change the output. No console errors, page errors or hydration warnings. One dev console warning appears; see notes. |
| 15 | No `app/`, no `next.config.*` | pass | Neither exists. |
| 16 | Vercel check green on Node 24.x | **unchecked** | The branch is not pushed. Tech-lead must confirm this after the push. |
| 17 | No invariant regressions | pass | See below. |

## Invariants touched

- **S1** holds. No imports changed.
- **S2** holds. `pages/index.js` still links both apps. `components/layout.js` still wraps the pages, and its header link goes to `/` (verified by clicking).
- **S3**: not touched. The `/api/fight` caps are unchanged and `fight-api-caps.spec` passes.
- **W1 and W2**: no diff under `lib/`, `components/apps/` or `pages/api/`. Unit tests and battle specs pass.
- **H1-H3**: `pages/apps/starcraft-helper.js` is untouched. Both Randomize buttons work under React 19.
- **A1-A3**: not applicable.

## spec-checklist.md

- Contracts: no names changed.
- Scope: no `golang/` diff, no Recharts, no `app/`, no ESLint, no `strict`, no `.js` to `.ts` conversion, and ARCHITECTURE.md is untouched (SGS-023 owns it).
- Naming: not applicable.
- S1/S2: pass.
- The other sections are not touched.

## Lint

`npx tsc --noEmit` exits 0. There is no other linter configured.

## Review bot

`reviewBot.cli` and `rulesFile` are empty in REPO.md. No bot was run, so there is nothing to reconcile.

## Conventions

- The `<Link>` rewrites follow the Next 13+ idiom. The header title keeps `utilStyles.colorInherit` on `<Link>` itself, matching the old `<a>` (`components/layout.js:53`). The image link and the landing links had no class before and have none now.
- `tsconfig.json` keeps the layout Next writes. The pre-existing odd `, "pages/apps/combat-simulator.js"` line was normalized by Next, which is acceptable.
- Commits are authored by choinickolas@gmail.com. Their messages have no ticket ids, factory pointers or PR numbers. The PR description draft is also clean.

## REPO.md review checklist

- **Every diff**: `next build` passed and every touched page was loaded under `npm run dev`. I went through each user flow by clicking (landing, combat simulator form and results, header link home, StarCraft buttons).
- **Shared code** (`pages/index.js`, `components/layout.js`): the importers are every app page through Layout. I applied the Combat simulator and Starcraft helper flows above.
- **Combat simulator**: no field round-trip changed. I sent `/api/fight` boundary requests (405, malformed JSON, 0 units) with curl.
- **golang/**: not touched.

## Non-blocking notes

1. **The scroll-behavior message is a browser `console.warn`, not only a server log.** Implementer report 1 says otherwise. It fires in dev on client-side navigation from `/` to `/apps/combat-simulator`: "Detected `scroll-behavior: smooth` on the `<html>` element...". The ticket puts this out of scope and the criterion covers errors and hydration warnings, so it does not block. A follow-up should know the cause: from Next 16 on, the router no longer turns off smooth scrolling during route transitions unless `data-scroll-behavior="smooth"` is set. Production client navigations may now scroll smoothly to the top instead of jumping. That is a small UX change.
2. **`engines.node` is `>=22.12.0`, as the ticket specifies.** Vercel usually warns that an open-ended `>=` range can auto-upgrade to a new major. The project is pinned to 24.x in settings, so this is cosmetic. Check the Vercel build log when the check runs.
3. **`@playwright/test` is now `devOptional` in the lockfile.** It was `dev` before. The cause is Next 16's optional peer dependency on it. This is harmless: `npm ci --omit=dev` still installs it only if needed.
4. **Bootstrap 5.1 to 5.3.8 is a minor-version CSS change.** 5.3 moved to CSS-variable color modes. The pages rendered normally and acceptance passed. I did no pixel comparison.

## Coverage

- Files reviewed: `.gitignore`, `components/layout.js`, `next-env.d.ts` (deletion), `package.json`, `package-lock.json` (root entry, key package versions, registry hosts and dev flags; I did not read every transitive entry), `pages/index.js`, `tsconfig.json`, `vitest.config.mts`.
- Not reviewed:
  - The Vercel preview build and its Node version, because the branch is not pushed.
  - The PR description, because no PR exists.
  - A side-by-side `/api/fight` response from `main` running Next 12. I did not install Next 12. Instead I checked the response shape against the OpenAPI spec and the contract specs.
- Processes: I stopped the dev server on 3877. Nothing is left running or listening. Playwright's `webServer` started and stopped the acceptance servers itself.
