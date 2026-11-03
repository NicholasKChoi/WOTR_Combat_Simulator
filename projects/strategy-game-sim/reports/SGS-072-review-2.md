# SGS-072 review 2 (delta, rework 1)

Verdict: **APPROVE**

Branch `sgs-072-aoe4-pin-persistence-label` (local only; `git ls-remote origin` finds no such branch), tip `63d1f7ce4dab4301d1a56a54f97c3fe4ebed204d`, a single commit on `9e4c4e05f279ae287baae07ff0f4723a26a795fe` (the tip review 1 checked). Base `origin/main` `c7ca461106bb42e48cb7b3913791b34ee105cb7f`. Delta reviewed: `git diff 9e4c4e0..63d1f7c`.

## Blocking findings

None.

## Delta checks

1. **Scope.** The commit changes only `acceptance/aoe4-build-order-pin-compare.spec.ts` (+42/-23) and `docs/aoe4-build-order.md` (2 lines). No production file changed, so the production code is byte-identical to 9e4c4e0.
2. **Unpin before the restore** (spec :568, "an Unpin before the restore lands wins over the restore"). The test does Run at 600, Pin, Unpin, then releases the held restore and waits for its response. It asserts `pinned-label` has count 0, `unpin-run` is disabled, and the stored key is null. Mutation: I dropped both `|| pinTouched.current` guards (page :118 and :122). The test then **failed** with `pinned-label` count expected 0, received 1. The old test was retitled to "a Pin before the restore lands wins over the restore" (:553). That title matches what it does, and it also failed under the same mutation (label 20:00 instead of 10:00).
3. **Label after a later Run** (:381-382). After pinning `<BUILDS[1].name> (edited)`, the test runs `DEFAULT_PASTE` and asserts the label is unchanged. Mutation: `pinnedName={pin ? (run?.name ?? pin.name) : null}`. The test **failed** (expected `Pinned: ENG Spear/Longbow into MAA/Crossbow (edited), 20:00`, received `Pinned: ENG 1TC, 20:00`).
4. **Reload spec** (:342). The test asserts `tab-build` has `aria-selected="true"` after the restore and before `showTab`. Mutation: the restore calls `setTab('results')` before `setPin`. The test **failed** (expected `"true"`, received `"false"`).
5. **Retouched last step of 'pin is disabled while the shown run equals the pin'** (:418-424). The sequence is now: Run at 1200 (Pin enabled), Pin (Pin disabled), Unpin (Pin enabled). Mutation, matching the spec rule "after Unpin with a shown result it is enabled": `alreadyPinned` falls back to a `lastPinned` ref that `pinShownRun` sets and Unpin never clears (`(pin ?? lastPinned.current)` in the comparison). Results:
   - The new test **failed** at :424 (`pin-run` expected enabled, received disabled).
   - The same test from 9e4c4e0 **passed** under this mutation, so the retouch closes the gap review 1 noted.
6. **Docs.** The new wording at `docs/aoe4-build-order.md:887-888` says "enabled while a result is shown, unless its text and duration both equal the pinned run's". This matches the code:
   - `pin-run` is disabled when `current === null || alreadyPinned`.
   - `alreadyPinned` = result, run and pin all exist, `pin.text === run.text` and `pin.durationSeconds === run.durationSeconds` (page :190).
   - So Pin is enabled when either value differs, and also when there is no pin.

   No other sentence in the paragraph changed.

## Acceptance criteria

All criteria that review 1 marked pass still pass, because production is unchanged and the specs pass. The three that were open are now met:
- Criterion 4 (label fixed after a Run): covered by check 3.
- Criterion 10 (Pin or Unpin before the restore wins): covered by check 2.
- Criterion 14 (docs): check 6.

I ticked every criterion except one:
- **Unticked:** "tsc, lint:dup, npm test, npm run acceptance pass; every edited existing test is listed in the PR description". The commands pass (see Commands), but there is no PR yet, so I could not check the PR-description half.
- **Ticked:** all six Rework 1 boxes. The optional box is ticked for the strengthened step. The optional post helper was skipped, which that box allows.

## Invariants touched

S1, S3 and A3: no production change, so each holds as in review 1. The diff touches only tests and docs.

## Linter

`npx tsc --noEmit` is clean. `npm run lint:dup` found 0 clones (run after deleting the throwaway config).

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty, so no bot was run.

## Conventions

- `holdFirstSimulate` (spec :308) is the gate code the two race tests used to repeat, moved into one helper next to `trackPosts` and `expectNoPin`. That follows the file's helper style.
- The new Unpin test uses the same 300 ms in-page wait as the existing Pin test (:560).

## Load run

- I started one shared `next dev` on port 4131 (Node 24.22.2) and used a throwaway config with `reuseExistingServer: true`, deleted afterwards.
- `aoe4-build-order-pin-compare.spec.ts --repeat-each=10 --workers=4`: **270/270 passed** (27 tests x 10).
- At the same time, on the same server, `aoe4-build-order.spec.ts` and `aoe4-build-order-m3-flow.spec.ts` ran with `--repeat-each=2 --workers=3`: **112/112 passed**.
- Baseline single run of pin-compare: 27/27. The count was 26 at 9e4c4e0; the new Unpin test makes 27.

## Commands

`npx tsc --noEmit` OK. `npm run lint:dup` 0 clones. `npm test`: 44 files, 1307 passed, 10 skipped. I did not rerun the full `npm run acceptance` or `npx next build`, because production code is unchanged since review 1, which ran both.

## Non-blocking notes

- The Pin-before-restore and Unpin-before-restore tests check absence after a fixed 300 ms wait following the restore response. With correct code they cannot flake. Under heavy load, though, a regression could set the pin later than 300 ms and the tests would miss it. A positive signal would be stronger, for example waiting until the restore's `response.json()` has resolved. Low value; leave as is.
- The branch is not on origin. The manager or the PR step pushes it, and the PR description must list the edited existing tests (criterion 15).

## Coverage

- Reviewed the full delta: both changed files, plus the page code (`pages/apps/aoe4-build-order.tsx` :100-205), to aim the mutations.
- Mutations were run on a shared dev server with HMR and reverted with `git checkout`; the tree was clean afterwards.
- REPO.md checklist: "Every diff" and "AoE4 build order". Production is unchanged and the page flows were exercised through Playwright. The docs sentence was checked against the code. There is no chart change.
- The dev server is stopped and port 4131 is free. Worktree `worktrees/review-sgs-072-r2` is removed.
