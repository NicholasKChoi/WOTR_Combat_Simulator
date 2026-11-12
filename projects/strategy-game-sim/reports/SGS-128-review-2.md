# SGS-128 review 2

- Branch `sgs-128-shared-test-helpers-and-jscpd-gates`, tip c85f1e0 (previous bounced tip 16efd1a), base `main`.
- This is a full review after Rework 1. I read the rework delta (`16efd1a..c85f1e0`) line by line and re-read the whole `main...HEAD` diff.
- Verdict: **APPROVE**

## Rework 1 required fixes

| Fix | Landed | Evidence |
|---|---|---|
| `.jscpd.tests.json` pattern `{**/*.test.ts,**/*.spec.ts,**/*test-helpers.ts,**/route-test-support.ts,helpers.ts}`, with `acceptance/helpers.ts` listed under `--debug` | yes | `.jscpd.tests.json:3` matches the text verbatim. The `--debug` file list includes `acceptance/helpers.ts`, all three `*test-helpers.ts` and `route-test-support.ts` (139 files). |
| `"maxLines": 5000` in both configs | yes | `.jscpd.json:7` and `.jscpd.tests.json:8`. The `--debug` runs list `acceptance/aoe4-my-builds.spec.ts` (1307 lines) and `lib/aoe4-build-order/schema.test.ts` (1007 lines) as analyzed in both configs. The tests config skips nothing. The default config skips only CSS files and two files under 8 lines (`format-time.ts`, `landmarks.ts`), which is below its minimum. |
| Fold the 19-line fixture into `gatedTest(prefix)` in `acceptance/helpers.ts`, used by both specs. Fold the locked-while-loading block into one local helper. No assertion removed. | yes | `acceptance/helpers.ts:288-310` holds `Gate` and `gatedTest`, a copy of the removed fixture with the prefix as a parameter. `aoe4-my-builds.spec.ts:39` and `aoe4-save-open.spec.ts:31` call it with their old prefixes. `expectLockedWithoutRun` (`aoe4-my-builds.spec.ts:52-59`) keeps all four disabled and `aria-busy` checks, the debounce wait and `posts` length 0. Both former call sites (`:329`, `:424`) still call `gate.open()` afterwards. |
| `lint:dup` exits 0 with both configs; `tsc` and `npm test` pass | yes | I ran these myself (see Lint). |

## Blocking findings

None.

## Spec gaps

None.

## Acceptance criteria

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | `lint:dup` exits 0, runs both configs, and exits non-zero when either finds a clone | pass | `package.json:10` is `jscpd && jscpd --config .jscpd.tests.json`. Both configs report 0 clones (223 and 139 files). I probed each leg separately with a temporary file, deleted afterwards:<br>- A 15-line copy fails the default config first (exit 1).<br>- A 6-line, 114-token copy of `fakeStorage` lines 1-7 passes the default config, then fails the tests config (exit 1), naming `probe.test.ts` and `storage-test-helpers.ts`. |
| 2 | Default config scans `acceptance/` at 8/70; tests config scans the same paths at 5 lines, test and helper files only; thresholds 0; `maxLines` 5000 in both (rework 1); `acceptance/helpers.ts` scanned (rework 1); no ignore entries or markers | pass | The config files and `--debug` output above. `git grep jscpd:ignore` finds nothing, and neither config has an `ignore` key. |
| 3 | No local `fakeStorage`, `throwingStorage` or `throwing` in test files; the three files import the shared ones | pass | The grep finds nothing. The three files import from `./storage-test-helpers`. |
| 4 | No local `stubFetch` or `stubGlobal('fetch'` in test files; kept helpers listed | pass | The grep finds only `fetch-test-helpers.ts`. `auto-run.test.ts` `reply`/`unreadable` are kept for the reasons given in implementer report 1, as review 1 found. |
| 5 | `storage-test-helpers.test.ts` covers every `throwingStorage` member and the `fakeStorage` behaviour | pass | The six-row throw table includes `length`. The seeded, mutation and isolation cases can each fail: dropping a member's `throw` fails its row; a module-level map fails `fakeStorage().keys()` being `[]`; using the seed object as the backing store fails `seed` being unchanged. |
| 6 | Storage tests seed through the record, partial throwing storages are built from the shared helpers, assertions unchanged, edited files listed | pass | The diff of `expect` lines changes only setup (`fakeStorage({ [KEY]: raw })`, `Object.assign(fakeStorage(), throwingMember)`, `lastCall(fetch)`). |
| 7 | Fold placement rules; S1 | pass | Route fakes are in `route-test-support.ts`. Cross-app OpenAPI folds are in `acceptance/openapi-schemas.ts`; they take data as arguments and import no app code. The WOTR `submitFight` is in `acceptance/helpers.ts`. The Vitest/Playwright floor check is `productionChecks` in `production-floors.ts`, which has no runner import. `gatedTest` imports only Playwright and `uniqueClient`. No spec imports another spec. |
| 8 | `npm test` and `npx tsc --noEmit` pass | pass | `tsc` is clean. `npm test`: 74 files, 2351 passed, 13 skipped. |
| 9 | Probe: copying the `fakeStorage` body makes `lint:dup` fail, naming both files | pass | The 15-line probe reported `probe.test.ts [1:26 - 16:7]` with `storage-test-helpers.ts [1:28 - 16:6]`, exit 1. |
| 10 | `ARCHITECTURE.md` describes both configs and the helper files | pass | `ARCHITECTURE.md:46-51`. Each sentence now holds: both configs run, `acceptance/` is scanned, the 8/70 and 5/70 minimums are right, and the tests config covers `acceptance/helpers.ts`. |
| 11 | No invariant regressions | pass | See below. |

## Invariants touched

- **S1 (apps independent):** holds.
  - `acceptance/helpers.ts` already held helpers for both apps at base.
  - The new `gatedTest`, `openapi-schemas.ts` additions and `submitFight` import nothing across apps.
  - No `components/apps/<x>` or `lib/<x>` file imports another app.
- **A1-A3:** not affected.
  - `production-floors.ts` gains `productionChecks`, a pure function used only by tests.
  - It reads `MAX_FLOATING_AT_1200` and the floors table unchanged.
  - No simulation-path change.
- **W1/W2, S2/S3, H1-H3:** paths not touched.

## Lint

- `npx tsc --noEmit`: clean. `tsconfig.json` includes `**/*.ts`, so `acceptance/` is type-checked.
- `npm run lint:dup`: exit 0. Default config 0 clones over 223 files; tests config 0 clones over 139 files.

## Bot reconciliation

- REPO.md has no `reviewBot.cli` or `rulesFile`, so this section was skipped.

## Non-blocking notes

- `acceptance/aoe4-save-open.spec.ts:10`: `gatedTest` sits between `buildOrderFrom` and `buildPath`, which breaks the alphabetical order of that import list. In `aoe4-my-builds.spec.ts` it is in order.
- `.jscpd.tests.json` `helpers.ts` alternative: it matches a root-level `helpers.ts` in any of the four scanned paths, not only `acceptance/`. Today only `acceptance/helpers.ts` exists, so it matches by path in practice. A future `lib/aoe4-build-order/helpers.ts` would also be scanned, which is harmless.
- `ARCHITECTURE.md:50-51` lists four shared test helper files but not `lib/aoe4-build-order/route-test-support.ts`. That file now also holds `getterFor`, `rejectingGetter`, `withBroken` and `INVALID_SAVE_BODIES`. The sentence does not claim to be complete, and the ticket asked for exactly those four, so this is not a contradiction.
- Carried over from review 1, still open:
  - Several specs declare `WARM_UP_TIMEOUT_MS` locally beside the new export in `acceptance/helpers.ts`.
  - `aoe4-simulate-api-contract.spec.ts` keeps a local `keys`.
  - `fight-api-contract.spec.ts` keeps `referencedSchemas` beside `referencedSchemaNames`.
- The refactored Playwright specs have been type-checked but not run (implementer report 2). The acceptance-test gate should run at least:
  - `aoe4-my-builds.spec.ts` and `aoe4-save-open.spec.ts`, for the `gatedTest` fixture;
  - the folded contract and prebuilt-farms specs.

## UI inspection

- Not run. The diff changes only tests, test helpers, jscpd configs, `package.json` and ARCHITECTURE.md. No rendered UI changed.
- For the same reason I skipped the REPO.md `### Every diff` steps that cover pages: `next build` and loading touched pages. No page or component source is in the diff.

## Coverage

- Reviewed the rework delta `16efd1a..c85f1e0` in full: both jscpd configs, `acceptance/helpers.ts`, `aoe4-my-builds.spec.ts` and `aoe4-save-open.spec.ts`.
- Re-read the whole `main...HEAD` diff:
  - `lib/` route support, `production-floors.ts` and its test, `builds.test.ts`;
  - the storage helper and its test;
  - `package.json`, `ARCHITECTURE.md`, `acceptance/openapi-schemas.ts`;
  - the WOTR and contract spec folds;
  - every added or removed `expect` and `it` line across the test files.
- The jscpd behaviour was confirmed with `--debug` runs and two clone probes in the review worktree. The probe file was deleted afterwards.
- REPO.md `## Review checklist`: the AoE4 section's `Paths:` matches the `lib/` and `components/` test files. Its one rule that applies is "no helper copied from another `lib/aoe4-build-order/` module", and this diff removes copies rather than adding any. The UI rules do not apply. The other sections' paths are not touched.
- I ran no acceptance or browser tests, per the gate rules.
