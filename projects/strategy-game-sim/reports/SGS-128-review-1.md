# SGS-128 review 1

- Branch `sgs-128-shared-test-helpers-and-jscpd-gates`, tip 16efd1a, base `main` (cdc51b1). Full review.
- Verdict: **REQUEST CHANGES**

## Blocking findings

1. `.jscpd.tests.json:3` - contract - The pattern `**/{*.test.ts,*.spec.ts,*test-helpers.ts,route-test-support.ts,acceptance/helpers.ts}` never matches `acceptance/helpers.ts`.
   - Why: jscpd 4.3.0 (`@jscpd/finder` `getFilesToDetect`) joins each glob as `${path}/${pattern}`. For the `acceptance` path, the last alternative becomes `acceptance/**/acceptance/helpers.ts`.
   - Evidence: `npx jscpd --config .jscpd.tests.json --debug` lists every acceptance spec but not `acceptance/helpers.ts` (136 files).
   - Impact: the 5-line gate never checks the shared acceptance helper file that this ticket grows. This breaks the ticket's Scope "Tests config" bullet ("a `pattern` limited to ... test helpers (`*test-helpers.ts`, `route-test-support.ts`, `acceptance/helpers.ts`) ... it matches `acceptance/helpers.ts` by path"), acceptance criterion 2, and design C13.
   - Direction: change the pattern so that `acceptance/helpers.ts` is in the scanned list. I verified this one from the review worktree:
     `"pattern": "{**/*.test.ts,**/*.spec.ts,**/*test-helpers.ts,**/route-test-support.ts,helpers.ts}"`
     - With `--debug` it lists `acceptance/helpers.ts` (137 files).
     - The 5-line run on that file list reported 0 clones, so the fix needs no new fold.
     - The root-level `helpers.ts` alternative applies under each of the four paths. Today only `acceptance/helpers.ts` exists there (`git ls-files '**/helpers.ts'`), so in practice it matches by path.
     - If the spec owner reads "by path rather than any `helpers.ts`" strictly enough to rule out a future `lib/aoe4-build-order/helpers.ts`, say so in the PR.
   - Re-check: run `--debug` and confirm the file appears.

2. `.jscpd.json` and `.jscpd.tests.json` (no `maxLines`) - contract - Both configs silently skip files over 1000 lines (jscpd's default `maxLines`), and the skipped file hides real clones.
   - Skipped: `acceptance/aoe4-my-builds.spec.ts` (1307 lines) and `lib/aoe4-build-order/schema.test.ts` (1007 lines). The debug log shows `skipped! Code lines=1307 not in limits (5:1000)`.
   - With `--max-lines 5000`, the default config (8 lines) reports 2 clones, and the tests config with the fixed pattern reports the same 2:
     - `acceptance/aoe4-my-builds.spec.ts:45-64` and `acceptance/aoe4-save-open.spec.ts:38-57`: the `base.extend<{ client; gate }>` fixture (client, extraHTTPHeaders, gate) followed by the testid locator consts. 19 lines.
     - `acceptance/aoe4-my-builds.spec.ts:338-347` and `:438-447`: the "locked while loading" loop over `[select, duration, textarea, copyButton]` (disabled plus `aria-busy`), the debounce wait, `posts` length 0, then `gate.open()`. 9 lines.
   - Why it matters:
     - This diff adds `acceptance` to `.jscpd.json` `path`.
     - Its ARCHITECTURE.md text says `.jscpd.json` "checks ... `acceptance/`" and `.jscpd.tests.json` "checks the same paths, limited to test files".
     - The ticket says "Fold every clone either config reports".
     - The largest acceptance spec is exempt, and the gate's 0-clones result is false for it. The Bar treats a doc sentence the code contradicts as blocking.
     - Setting `maxLines` is not one of the forbidden escapes (threshold, `ignore`, `jscpd:ignore`).
   - Direction:
     - Add `"maxLines": 5000` to both `.jscpd.json` and `.jscpd.tests.json`.
     - Fold the fixture into `acceptance/helpers.ts`, for example a `gatedTest(clientPrefix)` factory that returns the `base.extend` with `client`, `extraHTTPHeaders` and `gate`. Both specs import it.
     - Fold the locked-while-loading block into one local helper in `aoe4-my-builds.spec.ts`, for example `expectLockedWithoutRuns(page, posts)`. Keep every assertion.
     - Re-run `npm run lint:dup` and confirm both configs analyze `aoe4-my-builds.spec.ts` and `schema.test.ts` (`--debug`).
   - If the manager rules `maxLines` out of scope, this becomes a text fix instead.
     - Append to ARCHITECTURE.md line 49, after "for blocks of at least 5 lines and 70 tokens.":
       "Both configs skip files longer than 1000 lines (jscpd's default `maxLines`)."
     - Record the two hidden clones as out-of-scope work.

3. `ARCHITECTURE.md:48-49` - contract (doc claim) - ".jscpd.tests.json checks the same paths, limited to test files and test helpers" is false for `acceptance/helpers.ts`, one of the four helper files the same paragraph lists.
   - This closes with finding 1. No text change is needed once the pattern scans the file.
   - If finding 1 were instead resolved by dropping `acceptance/helpers.ts` from the gate, the sentence would need to say so. That would contradict the ticket, so fix the config.

## Spec gaps

- None that block. The `maxLines` point (finding 2) is a gap the ticket did not foresee. The direction above stays inside its forbidden-escape list.

## Acceptance criteria

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | `lint:dup` exits 0, runs both configs, non-zero when either finds a clone | pass (literal) | `package.json` `jscpd && jscpd --config .jscpd.tests.json`. Both report `Found 0 clones` in the review worktree. The implementer's probe exited 1. The 0 hides 2 clones in a skipped file (finding 2). |
| 2 | `.jscpd.json` scans `acceptance/` at 8/70; tests config scans same paths at 5 limited to test and helper files; thresholds 0; no ignore entries or markers | **fail** | `acceptance/helpers.ts` is not scanned (finding 1). Two >1000-line test files are skipped (finding 2). Thresholds are 0. `git grep jscpd:ignore` and the config `ignore` keys are empty. |
| 3 | Shared `fakeStorage`/`throwingStorage` in `storage-test-helpers.ts`; no local copies | pass | `git grep "function fakeStorage\|throwingStorage =\|const throwing =" -- '*.test.ts'` is empty. The helper implements all `Storage` members with no casts. |
| 4 | Helper tests: each `throwingStorage` member throws; `fakeStorage` seeding, reflection, no aliasing | pass | `storage-test-helpers.test.ts` has a six-member throw table plus `length`. The seeded, set/remove/clear and isolation cases can fail (the implementer's mutation checks name the failing asserts). |
| 5 | Fetch stubs go through `fetch-test-helpers.ts`; no local `stubFetch`/`stubGlobal('fetch'` | pass | `git grep` returns only `fetch-test-helpers.ts`. The `auto-run.test.ts` `reply`/`unreadable` build `Response` objects and never stub global fetch; the report explains this. |
| 6 | (respec 1) Storage tests seed via `fakeStorage({ [KEY]: raw })`, partial throwing storages built from the shared helpers, same tests and assertions, edited files listed | pass | Diffs of `pin-storage`, `chart-layout` and `my-builds-storage` tests: same `it` names and the same `expect` lines. The `myBuildsAvailable` table was reshaped to `[label, member]` with the same rows. The implementer lists every edited test file. |
| 7 | Route helpers and invalid-body rows shared via `route-test-support.ts` | pass | 5 shared rows. `builds-routes` keeps 5 and `named-builds-routes` prepends its own string-body row (6). The `VALID_DURATION_SECONDS` 600 matches both tests' `VALID`. |
| 8 | Vitest/Playwright floor checks fold through a module both runners import, with no runner import | pass | `production-floors.ts` `productionChecks` imports neither vitest nor playwright. `builds.test.ts` and the prebuilt-farms spec keep `toBeGreaterThanOrEqual`/`toBeLessThanOrEqual` per tuple. The new `production-floors.test.ts` covers the pairing. |
| 9 | Cross-app acceptance folds are app-neutral (S1) | pass | `openapi-schemas.ts` additions (`keys`, `examples`, `expectBody`, `referencedSchemaNames`) take data as arguments and import nothing app-specific. `submitFight` sits with the WOTR helpers. No spec imports another spec. |
| 10 | ARCHITECTURE.md describes both configs and the helper files | **fail** | Findings 2 and 3. |

## Invariants touched

- S1 (no app imports another app's code): holds. See criterion 9.
- A1-A3 (engine): not touched. `production-floors.ts` gains a pure function used only by tests. Its existing exports are unchanged.
- W1/W2: not touched.

## Lint

- `npx tsc --noEmit`: clean.
- `npm run lint:dup`: 0 clones in both configs (220 and 136 files). See findings 1 and 2 for what those numbers miss.
- I did not run `tsc --noUnusedLocals` (it is not in `commands.lint`). The implementer reports fixing two unused imports it found that way.

## Bot reconciliation

- REPO.md has no `reviewBot` block, so this section was skipped.

## Non-blocking notes

- `WARM_UP_TIMEOUT_MS = 60_000` is still declared locally in:
  - `aoe4-simulate-api-prebuilt-farms.spec.ts`
  - `-prebuilt-plans.spec.ts`
  - `aoe4-named-builds-api.spec.ts`
  - `-create.spec.ts`
  - the contract specs

  `acceptance/helpers.ts` now exports it, so these specs could import it. They are below the jscpd minimum, so they are not clones.
- `aoe4-simulate-api-contract.spec.ts` keeps a local `keys` although `openapi-schemas.ts` now exports `keys`. `fight-api-contract.spec.ts` keeps its own `referencedSchemas` beside the new `referencedSchemaNames`.
- `aoe4-build-order-client-check.spec.ts` has a double blank line where `TWO_UNKNOWN_IDS` was removed.
- `aoe4-build-order-pin-compare.spec.ts`: the `pinAndExpectLabel` function sits between the const locator declarations rather than after them.
- `aoe4-compact-view.spec.ts` has a pre-existing unused `bands` const. It is out of scope, and the implementer noted it.

## UI inspection

- Not run. The diff changes only tests, test helpers, jscpd config and ARCHITECTURE.md. No rendered UI changed.

## Coverage

- Reviewed every file in `git diff main...HEAD`:
  - both jscpd configs, `package.json` and `ARCHITECTURE.md`
  - the storage, fetch and route helpers and their call sites
  - `production-floors.ts` and its tests
  - `builds.test.ts`
  - `acceptance/helpers.ts`, `acceptance/openapi-schemas.ts` and every folded spec
- jscpd behavior was confirmed against `node_modules/@jscpd/finder` and by `--debug` runs in the review worktree.
- No acceptance, browser or e2e tests were run, per the gate rules. I did not run `npm test` and relied on the implementer's 2351 passing; the unit changes are setup-only, with the assertions preserved.
- REPO.md `## Review checklist`: no section's `Paths:` matches these test and config files beyond `### Every diff`, which was applied.
