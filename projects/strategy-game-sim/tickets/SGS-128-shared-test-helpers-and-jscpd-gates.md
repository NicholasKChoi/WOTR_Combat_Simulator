# SGS-128: Share the storage and fetch test helpers and add the two jscpd gates

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M9 / M9.11, M9.9 (the `acceptance/` scan part)
- **Priority**: high
- **Risk**: standard
- **Invariants**: S1 Apps are independent
- **Unverified assumptions**: none
- **LOC estimate**: ~500 (no production code: test code and config only. About 19 clone folds across roughly 20 spec and test files, the new `storage-test-helpers.ts` and its call sites in three test files, two fetch-stub moves, two jscpd configs, `package.json`, `ARCHITECTURE.md`. One unit; see Scope for why it does not split)
- **Depends on**: none
- **On merge**: none
- **Source**: `design/M9.md` C12, C13 and criteria M9.11, M9.9; `plans/M9-20261111.md` outline A

## Context

`npm run lint:dup` scans only `lib/aoe4-build-order`, `components/apps/aoe4-build-order` and `pages/api/aoe4-build-order` at 8 lines, so copy-pasted test and acceptance code slips through: three component tests each define their own fake `Storage`, and two component tests each define their own fetch stub beside the one `fetch-test-helpers.ts` exports. This ticket removes those copies and adds the two gates (`acceptance/` in the default scan; a stricter 5-line scan over test and helper files) so every later M9 test is written against them.

Measured at `origin/main` (cdc51b1) with the C13 settings: the tests config reports 19 clones and the default config with `acceptance` added reports 9, all of them also among the 19. Sixteen sit in `acceptance/*.spec.ts`, one pairs `lib/aoe4-build-order/builds.test.ts` with `acceptance/aoe4-simulate-api-prebuilt-farms.spec.ts`, and two pair `builds-routes.test.ts` with `named-builds-routes.test.ts` (the `getterFor`, `rejectingGetter` and `withBroken` route fakes). Four acceptance clones cross the two apps: `combat-simulator.spec.ts` with `fight-api-caps.spec.ts` (both WOTR), and the AoE4 contract specs (`aoe4-simulate-api-contract`, `aoe4-builds-api-contract`, `aoe4-named-builds-api-contract`) with `fight-api-contract.spec.ts` and `fight-api-spec-surface.spec.ts` (the Ajv OpenAPI validator setup and spec-shape checks).

**Size and split.** The work is one unit: C13 gives `.jscpd.tests.json` the same `path` list as `.jscpd.json`, including `acceptance`, so neither gate passes until the acceptance clones are folded, and the storage-helper fold is what the tests gate checks. A split into "acceptance path plus its clones" and "helpers plus tests gate" would leave the second ticket's gate scanning `acceptance/` too, so it would carry the same folds. The ~500 lines are test code and config; there is no business logic.

## Scope

- **Storage helper.** New `components/apps/aoe4-build-order/storage-test-helpers.ts` with the two exports of design C12:
  - `fakeStorage(entries?: Record<string, string>)` returns a `Storage & { keys(): string[] }` over the seeded entries. It implements every `Storage` member (`getItem`, `setItem`, `removeItem`, `clear`, `key`, `length`) for real, so no caller casts it, plus `keys()` listing the stored keys.
  - `throwingStorage`: a `Storage` whose `getItem`, `setItem`, `removeItem`, `clear` and `key` throw when called and whose `length` throws when read.
  - A small `storage-test-helpers.test.ts` covers both: each `throwingStorage` member throws (one table), and `fakeStorage` returns seeded entries, reflects `setItem`, `removeItem` and `clear` in `getItem`, `keys()` and `length`.
- **Storage call sites.** `pin-storage.test.ts`, `chart-layout.test.ts` and `my-builds-storage.test.ts` drop their local `fakeStorage`, `throwing` and `throwingStorage` and import the shared ones. Every call that seeded the local `fakeStorage(raw)` (a single string stored under that file's key constant) becomes `fakeStorage({ [KEY]: raw })` with the same constant; `fakeStorage()` stays as is. The local `chart-layout` copy had no `removeItem`; the shared one adds it, and no test asserts its absence. A storage that throws on only some members (the partial storages in `my-builds-storage.test.ts`'s "setItem throws" and `myBuildsAvailable` cases) is built from the shared helpers, for example a `fakeStorage()` with members taken from `throwingStorage`, not from a locally defined throwing function. Every assertion stays as it is; only setup changes.
- **Fetch helpers.** A local fetch helper in a test file is removed when a `fetch-test-helpers.ts` export (`stubFetch`, `lastCall`, `reply`), called with arguments, gives the same requests and responses that file's tests rely on. That covers `saved-build-loader.test.ts`'s local `stubFetch` and `json` (design C12) and `simulate-client.test.ts`'s argument-free `stubFetch()` (the shared `stubFetch` with a `reply` of `{}`; it already rejects an aborted signal the same way). A helper whose signature or return differs stays, for example `auto-run.test.ts`'s `reply(status, body)` and `unreadable`, which build a `Response`-shaped object directly; the implementer lists each local fetch helper it keeps and why in its report.
- **Default config.** `.jscpd.json`: add `acceptance` to `path`; minTokens, minLines and threshold unchanged.
- **Tests config.** New `.jscpd.tests.json`: the same `path` list including `acceptance`, `minLines` 5, `minTokens` 70, `threshold` 0, `format` typescript and tsx, `gitignore` true, and a `pattern` limited to test files (`*.test.ts`, `*.spec.ts`) and test helpers (`*test-helpers.ts`, `route-test-support.ts`, `acceptance/helpers.ts`). The glob syntax is the implementer's; it matches `acceptance/helpers.ts` by path rather than any `helpers.ts`.
- **Script.** `package.json` `lint:dup` runs both configs and fails if either fails (design C13).
- **Clone folds.** Fold every clone either config reports. Do not raise a threshold, add `ignore` entries, or add `jscpd:ignore` markers. Where each fold goes:
  - `lib/` route-test clones (`builds-routes.test.ts` with `named-builds-routes.test.ts`): into `lib/aoe4-build-order/route-test-support.ts`.
  - A clone within one spec: a local function in that spec.
  - A clone across AoE4 specs: into `acceptance/helpers.ts`.
  - A clone across WOTR specs (`combat-simulator.spec.ts` with `fight-api-caps.spec.ts`): a local function, or into `acceptance/helpers.ts` with the existing WOTR helpers.
  - A clone across the two apps' specs (the OpenAPI validator and spec-shape checks): into an app-neutral acceptance module, `acceptance/openapi-schemas.ts` (which already exports a `validator` over `docs/api/openapi.json`) or `acceptance/helpers.ts`. The folded function takes its data as arguments and imports nothing from either app's `components/apps/<app>/`, `lib/<app>/` or `data/<app>/`.
  - The Vitest-to-Playwright clone (`builds.test.ts` with `aoe4-simulate-api-prebuilt-farms.spec.ts`, the 1200 s floor checks): into a pure function in a module both runners can import (it imports neither `vitest` nor `@playwright/test`) that returns values each runner asserts on with its own `expect`, or by reshaping one side so the clone is gone; the assertions each test makes stay the same.
  - No spec of one app imports another app's spec, and no folded helper moves app code into the other app's files.
- **Docs.** `ARCHITECTURE.md`, the "AoE4 build order is checked for copied code" rule, says `lint:dup` uses only `.jscpd.json` at 8 lines over lib, components and the API route, and names only `lib/aoe4-build-order/test-helpers.ts` as the shared test helper; both become untrue. It must describe both configs (with `acceptance/` scanned) and list the component helpers (`storage-test-helpers.ts`, `fetch-test-helpers.ts`) beside `lib/aoe4-build-order/test-helpers.ts` and `acceptance/helpers.ts`. No other file mentions `lint:dup` or `.jscpd.json` at the base; recheck after the change.

**Out of scope:** the Tab-order spec and the final M9 doc pass; any new Vitest or Playwright test of product behavior; a DOM test environment; changing test expectations or production code; `strict` typing.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `npm run lint:dup` exits 0 and runs both `.jscpd.json` and `.jscpd.tests.json`; it exits non-zero when either one finds a clone
- [ ] `.jscpd.json` scans `acceptance/` at its existing 8-line and 70-token minimum, and `.jscpd.tests.json` scans the same paths at a 5-line minimum limited to test and helper files; both thresholds stay 0, and neither config nor any scanned file carries an `ignore` entry or a `jscpd:ignore` marker
- [ ] (respec 1) `git grep -n "function fakeStorage\|throwingStorage =\|const throwing =" -- '*.test.ts'` finds nothing (at the base it finds the three copies in `pin-storage.test.ts`, `chart-layout.test.ts` and `my-builds-storage.test.ts`); those files import `fakeStorage` and `throwingStorage` from `storage-test-helpers.ts`
- [ ] (respec 1) `git grep -n "function stubFetch\|stubGlobal('fetch'" -- '*.test.ts'` finds nothing (at the base it finds `saved-build-loader.test.ts` and `simulate-client.test.ts`); every match outside test files is in `fetch-test-helpers.ts`. Each local fetch helper left in a test file differs in signature or return from every `fetch-test-helpers.ts` export and is listed with the reason in the implementer's report
- [ ] (respec 1) `storage-test-helpers.test.ts` shows each of `getItem`, `setItem`, `removeItem`, `clear`, `key` and reading `length` on `throwingStorage` throws (a test fails if any member returns); and that `fakeStorage` seeded with two entries returns them, and that `setItem`, `removeItem` and `clear` change `getItem`, `keys()` and `length` accordingly
- [ ] (respec 1) The storage tests seed through the record (`fakeStorage({ [KEY]: raw })`) and build partial throwing storages from the shared helpers; every test that existed before still runs with the same assertions, and the implementer lists every test file it edited
- [ ] (respec 1) Every clone fold follows the placement rules in Scope: no spec imports another app's spec, and every function folded out of a cross-app clone imports nothing from either app's `components/apps/<app>/`, `lib/<app>/` or `data/<app>/`
- [ ] `npm test` and `npx tsc --noEmit` pass
- [ ] (respec 1) Probe (reviewer, not committed): copying the body of `fakeStorage` from `storage-test-helpers.ts` into a test file as a local function makes `npm run lint:dup` exit non-zero with a clone that names both files
- [ ] `ARCHITECTURE.md` describes both `lint:dup` configs with `acceptance/` scanned and lists the component test helpers beside `lib/aoe4-build-order/test-helpers.ts` and `acceptance/helpers.ts`
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-11

- Underspecified: the probe could not fail (no partner for a pasted old body); the size hid ~19 clone folds behind a mid-run split clause; clone placement ignored the cross-app and Vitest-to-Playwright clones and invariant S1; the fetch-helper rule, the `throwingStorage` members, the `fakeStorage` members and the seeding at call sites were undefined.
- Changed: probe pastes the shared helper's body; size stated as ~500 lines of test code as one unit with the reason; per-clone placement rules and S1 added; fetch helpers move only on a matching signature and return (`simulate-client.test.ts` in, `auto-run.test.ts` out); both storage helpers implement or throw on every `Storage` member, with a helper test; call sites seed through the record and partial throwing storages reuse the shared helpers; dropped the unverified-assumption on `pattern`, which `lint:dup` exercises for real.
- No branch work exists yet; nothing to keep or discard.
