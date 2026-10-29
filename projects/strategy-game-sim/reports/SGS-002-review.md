# SGS-002 review 1

Verdict: **APPROVE**

Branch `sgs-002-playwright-acceptance-harness` at 78048f7, base main 8532a0b. Reviewed `git diff 8532a0b...78048f7`
in a fresh detached worktree `worktrees/review-sgs-002-playwright-acceptance-harness`.

## Blocking findings

None.

## Spec gaps

None.

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | One `npm run acceptance` starts its own server on 3100, runs all specs, stops, exits 0 | pass | `npm ci`, `npm run acceptance:setup`, `npm run acceptance` in the review worktree: 6 passed. `playwright.config.ts:7-15` port 3100, `npx next dev -p 3100`, url on the same port, timeout 120s |
| 2 | Occupied port 3100 fails rather than reusing | pass | Started a node HTTP listener on 3100, ran `npm run acceptance`: exit 1, "http://localhost:3100 is already used ... set reuseExistingServer:true". `playwright.config.ts:13` |
| 3 | `acceptance:setup` installs Chromium; launch failure is a blocker, not a pass | pass | `package.json` script `playwright install chromium`; browser specs ran and passed here. The first implementer run correctly reported a blocker for missing libs |
| 4 | Landing spec fails on removed link, changed href, non-200 GET, wrong click destination or `<h1>` | pass | `acceptance/landing.spec.ts:11-14` exact-name link, `toHaveAttribute('href', route)`, `request.get(route)` 200; `:18-21` click, URL regex anchored with `$`, `h1` `toHaveText(name)` (full-text match; only one `<h1>` on non-home Layout pages, `components/layout.js:28-38`) |
| 5 | API spec posts string default armies as a `data:` object; checks 200 JSON, `survivor` string, `rounds` number | pass | `acceptance/helpers.ts:14-21,29-31`, `acceptance/fight-api.spec.ts:5-10` |
| 6 | Simulator spec waits for hydration, wraps the click in `waitForResponse`, asserts 200 and exact headings | pass | `acceptance/combat-simulator.spec.ts:6` `networkidle`; `:9-13` response promise created before click, POST filter, 200; `:15-16` `exact: true`. `networkidle` settled under `next dev` (30/30 with `--repeat-each=5`), so no alternate signal was needed |
| 7 | No interaction with StarCraft controls | pass | Only link click, `GET`, and `h1` read |
| 8 | Defaults and fill/post helpers in `acceptance/helpers.ts`, used by both specs | pass | imports in `fight-api.spec.ts:2`, `combat-simulator.spec.ts:2` |
| 9 | No over-assertion of response/DOM shape | pass | only `survivor`, `rounds`, two headings, status codes |
| 10 | `tsc --noEmit` and `next build` pass | pass | both clean in the review worktree |
| 11 | No untracked Playwright output after a run | pass | `git status --short` empty after runs; `test-results/` shows only under `--ignored` |
| 12 | No changes under `pages/`, `components/`, `utils/`, `styles/` | pass | diff stat: `.gitignore`, `acceptance/*`, `package.json`, `package-lock.json`, `playwright.config.ts` |
| 13 | No INVARIANTS.md regressions | pass | see below |

All 13 ticked in the ticket.

## Manager's extra checks

- **Lockfile**: top-level `name` is `"WOTR_Combat_Simulator"` (same as main), `lockfileVersion` 2. The diff adds only
  `@playwright/test` to root devDependencies plus `@playwright/test`, `playwright`, `playwright-core` 1.64.1 in both
  the `packages` and `dependencies` sections. No Vitest or other entries churned.
- **Server boot**: matches scope item 1 exactly (testDir `acceptance`, Chromium only, 3100, `reuseExistingServer:
  false`, 120s webServer timeout). It also adds a 60s per-test timeout, which is harmless.
- **Randomness**: no spec asserts a battle outcome. `survivor` is always a string (`getSurvivor` returns
  "attack"/"defend"/"n/a", `pages/api/fight.ts:37-44`) and `rounds` always a number; with 3/1/1 per side `rounds`
  >= 1, so no NaN. `--repeat-each=5`: 30/30 passed.
- **ARCHITECTURE.md**: already lists `acceptance/` as the home for end-to-end tests (lines 31 and 48); the
  specs live there. Vitest's config already excludes `acceptance/**`, so `npm test` does not pick up the specs (4/4).

## Invariants touched

The diff touches no invariant-scoped path (no `pages/`, `components/`, `utils/`, `styles/`, `lib/`). S1-S3, W1-W2,
H1-H3, A1-A3: not affected, hold. Spec-checklist: no Out-of-scope items, no `golang/`, no invented constants
(port 3100 and default armies are set by the ticket), names state intent.

## Linter

`npx tsc --noEmit`: clean (covers the new `.ts` files through tsconfig `**/*.ts`). No other linter configured.

## Bot reconciliation

`reviewBot.cli` is empty; `rulesFile` empty. Nothing to reconcile.

## Conventions

No sibling specs exist (first files in `acceptance/`). Compared with `vitest.config.ts` (the one existing test
config): `defineConfig` default export, single quotes, no semicolons; the new config matches. Commit is authored as
`choinickolas@gmail.com`, its message has no ticket ids or factory pointers, and neither do the shipped files.

## Non-blocking notes

- `acceptance/helpers.ts:12` `Armies` is a strict `Record<field, string>`. SGS-003 boundary cases (missing keys,
  numbers, non-numeric strings) will need to widen it, for example to `Partial<Record<..., string | number>>` for
  `postFight`. Fine for this ticket, but a known extension point.
- `acceptance/helpers.ts:3` `FIELDS` is exported but only used inside the module. Harmless.
- `@playwright/test` 1.64.1 declares `engines.node >=20`. Only a devDependency, and npm only warns on engine
  mismatch, so it won't break Vercel builds, but local runs need Node 20+ (host is 22).
- REPO.md `commands.acceptance` / `acceptanceSetup` / `acceptanceHarness` are still empty. The ticket leaves that to
  the manager after merge (H-1).

## Coverage

Reviewed every changed file: `.gitignore`, `acceptance/helpers.ts`, `acceptance/landing.spec.ts`,
`acceptance/fight-api.spec.ts`, `acceptance/combat-simulator.spec.ts`, `playwright.config.ts`, `package.json`,
`package-lock.json`. Also read `pages/index.js`, `pages/apps/combat-simulator.js`,
`components/apps/combat-simulator/results.js`, `components/layout.js`, `pages/api/fight.ts`, `vitest.config.ts`,
`tsconfig.json`, `ARCHITECTURE.md`. Ran `npm ci`, `npx tsc --noEmit`, `npm test`, `npx next build`,
`npm run acceptance:setup`, `npm run acceptance`, the occupied-port run, and `--repeat-each=5`.
REPO.md "Every diff" checklist: build run and pages loaded through the browser specs. The Combat simulator section
does not apply because no combat paths changed. No mutation testing beyond reading the assertions.
