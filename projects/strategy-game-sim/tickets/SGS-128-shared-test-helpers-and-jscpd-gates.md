# SGS-128: Share the storage and fetch test helpers and add the two jscpd gates

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M9 / M9.11, M9.9 (the `acceptance/` scan part)
- **Priority**: high
- **Risk**: standard
- **Invariants**: none
- **Unverified assumptions**: jscpd `pattern` (a glob over the scanned paths) selects test and helper files the way the config expects when combined with `path` and `gitignore`; checked by running `lint:dup`, not by a fake
- **LOC estimate**: ~150 (new `storage-test-helpers.ts` plus clone folds in `acceptance/` and the test files; no production code)
- **Depends on**: none
- **On merge**: none
- **Source**: `design/M9.md` C12, C13 and criteria M9.11, M9.9; `plans/M9-20261111.md` outline A

## Context

`npm run lint:dup` scans only `lib/aoe4-build-order`, `components/apps/aoe4-build-order` and `pages/api/aoe4-build-order` at 8 lines, so copy-pasted test and acceptance code slips through: three component tests each define their own fake `Storage`, and `saved-build-loader.test.ts` repeats the fetch stub and JSON reply that `fetch-test-helpers.ts` already offers. This ticket removes those copies and adds the two gates (acceptance scan; stricter 5-line scan over test and helper files) so every later M9 test is written against them. Measured at `origin/main` while writing: scanning `acceptance/` at the current thresholds reports 8 clones, and a 5-line scan over test and helper files across the four paths reports 19.

## Scope

- New `components/apps/aoe4-build-order/storage-test-helpers.ts` with the two exports of design C12: `fakeStorage(entries?)` returning a `Storage` that also exposes `keys()`, and `throwingStorage`, a `Storage` whose every method throws. Match the shapes the three current copies need (seed entries keyed by storage key, `getItem`/`setItem`/`removeItem`, `keys()` as used by `my-builds-storage.test.ts`).
- Replace the local `fakeStorage` and throwing-storage definitions in `pin-storage.test.ts`, `chart-layout.test.ts` and `my-builds-storage.test.ts` with the shared helpers. Asserted behavior is unchanged; only setup moves.
- `saved-build-loader.test.ts`: drop the local `stubFetch` and `json`; use `stubFetch`, `lastCall` and `reply` from `fetch-test-helpers.ts`. Other tests that repeat those fetch helpers (grep the component and `lib/` route tests for local `stubFetch`, `reply`-style response builders and similar, for example the local `reply` in `auto-run.test.ts` and the recording helpers beside `route-test-support.ts`) move to the shared helpers where the shapes match; leave one alone only where the shape genuinely differs.
- `.jscpd.json`: add `acceptance` to `path`; keep minTokens, minLines and threshold as they are.
- New `.jscpd.tests.json`: the same `path` list including `acceptance`, `minLines` 5, `minTokens` 70, `threshold` 0, `format` typescript and tsx, `gitignore` true, and a `pattern` limited to test files (`*.test.ts`, `*.spec.ts`) and test helpers (`*test-helpers.ts`, `route-test-support.ts`, `acceptance/helpers.ts`). The exact glob syntax is the implementer's.
- `package.json` `lint:dup` runs both configs and fails if either fails.
- Fold every clone either config reports, into `acceptance/helpers.ts` where two or more specs share it, or a local function where one spec repeats itself. Do not raise a threshold, add `ignore` entries, or add `jscpd:ignore` markers to pass. Examples of where clones sit today: the `json` helper repeated across `aoe4-auto-run.spec.ts`, `aoe4-my-builds.spec.ts` and `aoe4-save-open.spec.ts`; the rest comes from running the two configs.
- Docs: `ARCHITECTURE.md` says `lint:dup` covers only lib, components and the API route at `.jscpd.json`'s 8 lines and names only `lib/aoe4-build-order/test-helpers.ts` as the shared test helper; both statements become untrue. It must describe both configs and list the component helper files (`storage-test-helpers.ts`, `fetch-test-helpers.ts`) beside `lib/aoe4-build-order/test-helpers.ts` and `acceptance/helpers.ts`. Grep for other mentions of `lint:dup` or `.jscpd.json` and fix any that go stale.
- If the clone count after the helper moves is too large for one ticket (clearly over ~400 changed lines), stop and propose splitting the acceptance path and its clones from the helpers plus tests gate; both would stay roots.

**Out of scope:** the Tab-order spec and the final M9 doc pass; any new Vitest or Playwright test of product behavior; a DOM test environment; changing test expectations or production code; `strict` typing.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `npm run lint:dup` exits 0 and runs both the default config and `.jscpd.tests.json`
- [ ] `.jscpd.json` scans `acceptance/`, and `.jscpd.tests.json` scans the same paths at a 5-line minimum limited to test and helper files; the thresholds stay 0 and no clone is hidden by an ignore list or a marker
- [ ] No test file defines its own fake `Storage` or throwing storage: every such definition is imported from `storage-test-helpers.ts`; and no test file redefines the fetch stub or JSON reply that `fetch-test-helpers.ts` exports
- [ ] `fakeStorage` accepts seed entries and exposes `keys()`; `throwingStorage` throws from every `Storage` method (a test or the existing callers' "never throws on a storage that throws" cases exercise it)
- [ ] `npm test` passes and every test that existed before still runs with the same assertions (only setup moved); the implementer lists every test file it edited
- [ ] `npx tsc --noEmit` passes
- [ ] Probe: copying the old `fakeStorage` body back into a test file makes `lint:dup` fail (the reviewer runs this; nothing is committed)
- [ ] `ARCHITECTURE.md` matches the two-config gate and the helper list
- [ ] No INVARIANTS.md regressions

## Open questions

none
