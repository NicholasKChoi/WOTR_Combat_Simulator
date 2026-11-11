# SGS-125 implementer pass 2 (Rework 1)

- Ticket: SGS-125, Rework 1 (review), one required fix.
- Branch: `sgs-125-save-panel`. Tip: `ac5b1e6`, on top of `be351ae`.
- Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-125-save-panel`

## Required fixes

- [x] File-local helpers in `acceptance/aoe4-my-builds.spec.ts`, now used at every repeated site. Behavior and assertions are unchanged.
  - `holdCopy(page, name)`: holds the named `POST` with `holdRequests(page, NAMED_BUILDS_PATH, 'POST')`, tracks posts, submits the copy and waits for one post. Returns `{ release, posts }`. Used by 4 tests: late unstored create, in-flight create, late create after an edit, and create with no edit.
  - `holdVersion(page, beforeClick?)`: holds the `PUT` with `holdRequests(page, namedBuildUrl('*'), 'PUT')`, runs the optional `beforeClick` while the hold is active, tracks puts, clicks Save a new version and waits for one put. Returns `{ release }`. Used by 3 tests: the late new version, the late 503/412 table, and the held version that waits for release while a copy goes through. That last test passes `editedCopy` as `beforeClick`, so the copy `POST` still runs while the `PUT` hold is active, as before.
  - `releaseAndAwait(page, release, matches)`: sets up `waitForResponse`, calls `release()` and returns the response. Used at the 4 release-and-wait sites.
  - In the in-flight test, the `puts` and `requestfailed` trackers are now registered before `holdCopy` instead of between the hold and the submit. They still attach before any request goes out.
  - In the held-version test, the `response` listener is now registered before `editedCopy`. No `PUT` is made during `editedCopy`.

The ticket file has the box ticked. The text-only updates need no code change.

## Files touched

- `acceptance/aoe4-my-builds.spec.ts`: three helpers added and 7 tests changed to use them. 35 lines added, 41 removed.

## Tests

- `npx playwright test acceptance/aoe4-my-builds.spec.ts --grep 'storage unavailable|in flight and late answers'` ran the 9 tests in the edited describes: 9 passed, 0 failed.
- I did not rerun the full acceptance specs or `npm test`. Only this one spec file changed, and pass 1 ran both.

## Pre-existing tests edited

Every test listed below was added in pass 1 of this ticket on this branch. They were refactored to use the helpers as the rework requires, with assertions unchanged:
- `storage unavailable › a late create still warns although no link shows, until the next settled change`
- `in flight and late answers › while a create is held both buttons are disabled, and leaving aborts it without an error`
- `› a create released after a settled edit is stored and listed but selects nothing`
- `› a create released with no edit selects the build and shows the link`
- `› a new version released after a settled edit keeps the text and stores revision 2`
- `› a late ${code} shows no message …` (503 and 412 rows)
- `› a held new version waits for release while a copy goes through`

## Doc claims

- Comment on `holdVersion`: "`beforeClick` runs with the hold already active, so a copy saved there must pass the PUT-only hold." It is true because `holdVersion` awaits `holdRequests(..., 'PUT')` before `await beforeClick?.()`, and `holdRequests` sends non-matching methods on with `route.fallback()` (`acceptance/helpers.ts:153`).

## Pinned outputs

None.

## Mutation checks

- Break: `components/apps/aoe4-build-order/save-build.tsx:179`, changed `outcome.kind === 'conflict'` to `'never'` so a late 412 no longer records the lock.
  - Result: the test `a late 412 … locked` (which now uses `holdVersion` and `releaseAndAwait`) failed at `aoe4-my-builds.spec.ts:1151`, `expect(saveButton(page)).toBeDisabled()`, with "unexpected value enabled".
  - Undone with `git checkout` and checked with `git status`. The break was never committed.
- The other refactored tests run the same assertions as in pass 1, where their mutation checks were recorded.

## Codegen, build, lint

- codegen: not set for this repo.
- lint: `npx tsc --noEmit` reported 0 errors (tsconfig includes `**/*.ts`, which covers `acceptance/`). `npm run lint:dup` found 0 clones.
- build: not rerun. The only change is an acceptance spec, which `next build` does not compile.

## Invariant check

- A3: upheld. No production code changed.
- S3: upheld. No production code changed.

## Out-of-scope findings

None.

## Processes

The Playwright web server exits with each run. Nothing I started is still running.

## Status

`needs_review`
