# SGS-128 ticket re-spec 2 (Re-spec 1)

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-128-shared-test-helpers-and-jscpd-gates.md
Lint: `ticket-lint.py` clean.

## Summary

"Share the storage and fetch test helpers and add the two jscpd gates", component aoe4-build-order, Risk standard, Depends on none, criteria M9.11 and the `acceptance/` scan part of M9.9. Size is now stated up front as about 500 lines, all test code and config with no production code, and the ticket stays **one unit, not split**. C13 gives `.jscpd.tests.json` the same `path` list as `.jscpd.json`, including `acceptance`. So the "helpers plus tests gate" half of a split would still have to fold every acceptance clone. I measured at origin/main cdc51b1 in a throwaway worktree, since removed. The tests config finds 19 clones and the default config with `acceptance` added finds 9, all of them also among the 19.

All six spec-gate gaps are folded in:
1. **Probe.** The reviewer now pastes the body of `fakeStorage` from `storage-test-helpers.ts`, and `lint:dup` must exit non-zero with a clone naming both files.
2. **Size.** Stated as one unit with the reason, and the mid-run split clause is removed.
3. **Invariant S1 and clone placement.** S1 is in Invariants. Scope gives a placement rule for each kind of clone:
   - lib route clones go to `route-test-support.ts`;
   - a clone inside one spec becomes a local function;
   - AoE4-to-AoE4 clones go to `acceptance/helpers.ts`;
   - WOTR-to-WOTR clones become a local function or go with the WOTR helpers;
   - cross-app OpenAPI clones go to an app-neutral module (`acceptance/openapi-schemas.ts` already has a `validator`) that imports from neither app;
   - the Vitest-to-Playwright floor-check clone becomes a runner-neutral pure function.
   A criterion checks these rules.
4. **Fetch rule.** A local helper is removed when a shared export, called with arguments, gives the same behavior. `saved-build-loader.test.ts` is covered, and so is `simulate-client.test.ts`'s `stubFetch()`, which I found and which matches. `auto-run.test.ts`'s `reply` and `unreadable` stay, and the implementer lists any helper it keeps. The grep criteria were checked at the base: today they match exactly the files Scope names.
5. **Storage members.** `throwingStorage` throws from `getItem`, `setItem`, `removeItem`, `clear` and `key`, and when `length` is read. `fakeStorage` implements every `Storage` member for real (no cast) plus `keys()`. A new `storage-test-helpers.test.ts` covers both helpers.
6. **Call sites.** Calls seed with `fakeStorage({ [KEY]: raw })`. The missing `removeItem` in `chart-layout`'s old copy is not asserted anywhere. The partial throwing storages in `my-builds-storage.test.ts` are built from the shared helpers.

Also changed: Unverified assumptions is now `none`, because the `pattern` behavior is exercised for real by running `lint:dup`. I dropped the old `json` acceptance helper example, since it is not among the measured clones.

## Diagrams

None. Single-component change outside the core control loop.

## Open questions

None.

## Overlap

None that conflicts:
- SGS-131 (depends on SGS-128) expects the shared `fakeStorage` to take seed entries keyed by storage key, and expects partial storages to wrap it. The ticket now matches that.
- SGS-141 owns the final `ARCHITECTURE.md` pass and the Tab-order spec, and expects the two-config `lint:dup` that this ticket writes.

## Note

The spec gate suggested an optional `REPO.md` note that `lint:dup` now runs two configs. I left On merge as `none` because `commands.lint` already calls `npm run lint:dup`, so nothing the factory runs changes.
