# SGS-132 implementer report 1

- Ticket: SGS-132. Branch `sgs-132-save-panel-live-status`, tip `edca704a4ee400ec8bd9061633e441394a4f5007`, worktree `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-132-save-panel-live-status` (base origin/main 5564bd0; SGS-128 is merged there).
- Status: **needs_spec** (two pre-existing acceptance tests fail because of the new run-bar height; details below). Everything else in the ticket is done and committed.

## Files touched

- `components/apps/aoe4-build-order/save-build.tsx`: `save-panel` > `save-row` structure; exports `Saver`, `SavedStatus`, `saveStatusText`; `Saved` stores the revision (create 1, update the response's); always-mounted `save-status`; `onLinkKeyDown` on the link input and Copy link only; hint, form, storage notice and error below the row.
- `components/apps/aoe4-build-order/workbench.module.css`: `.savePanel`, `.saveRow`, `.saveStatus`, a `min-width: 1200px` query (no wrap, buttons `flex: none`, link `min-width: 8rem`); `.linkPanel` removed; `.copyForm`, `.linkHint`, `.saveError`, `.saveNotice` lose `flex: 1 1 100%` because the panel is now a column.
- `components/apps/aoe4-build-order/build-input.tsx`: `auto-run-status` moved before `SaveBuild`, so it stays on the select/duration/toggle line instead of taking its own line under the save panel. Test id kept.
- `components/apps/aoe4-build-order/save-build.test.ts`: `saveStatusText` table (9 rows) and a static no-save render case.
- `acceptance/aoe4-save-status.spec.ts` (new): 21 tests.
- `acceptance/helpers.ts`: now exports `isNamedPath`, `isNamedPost`, `isNamedPut`, `blockStorageWrites`, `stubNamed`, `reply` (moved, not copied).
- `acceptance/aoe4-my-builds.spec.ts`: those six definitions removed and imported from helpers. No assertion changed.
- `docs/aoe4-build-order.md`: Page paragraph, link/Copy link location, Escape scope, status clears with the link, new paragraph on the save row and status.

## Tests

- `npm test`: 74 files, 2370 passed, 13 skipped, 0 failed.
- `save-build.test.ts`: 27 passed. Invariants: status is empty when saving, when saved is null, when settled input differs (text, duration, selected); `Saved` vs `Saved version <revision>`; `save-panel` first child is `save-row` with `save-build`, `save-build-copy`, then an empty `save-status` carrying `role`, `aria-live`, `aria-atomic`.
- `acceptance/aoe4-save-status.spec.ts`: 21 passed. `aoe4-my-builds.spec.ts`: 73 passed (all). Also passed: `aoe4-small-screen` (except below), `aoe4-split-scroll` (except below), `aoe4-save-open`, `aoe4-compact-view`, `aoe4-auto-run-contract`, `aoe4-auto-run`, `aoe4-build-order-m4-flow`, `aoe4-build-order-run-errors`, `aoe4-step-annotations`, `aoe4-build-order-client-check`, `aoe4-build-order-inline-issues`. Not run: `aoe4-build-order-pin-compare`, `smoke-preview`.
- Pre-existing test edits: none (only the six helper definitions moved out of `aoe4-my-builds.spec.ts`).

## Failing pre-existing tests (reason for needs_spec)

Both pass on origin/main (verified in a scratch worktree, since removed) and fail on this branch:

1. `acceptance/aoe4-small-screen.spec.ts:75` `run bar at 1280 px > stays sticky at the top`: expects run-bar `top` to be exactly 0 after `scrollTo(0, 300)`.
2. `acceptance/aoe4-split-scroll.spec.ts:55` `each column scrolls on its own`: expects `scrollY < scrollHeight - innerHeight` after a column scroll.

Cause: the design's C1 puts the save panel on its own run-bar row, so the bar grows from 93.9px to 154.4px at 1280. The page's scroll slack is about the bar's page top (244.8px), and `useRunBarHeight` rounds `height + margin` up with `Math.ceil`. With the new bar the ceil overshoot is 0.61px (was 0.11px), so the document is 1px shorter: max scroll 244 against a bar page top of 244.8 (bar top 0.8px, not 0), and the fill in `openLongBuild` scrolls to the max, so `scrollY == max`. Both tests pass or fail on sub-pixel rounding of the bar height. I tried `Math.floor` in the hook: the sticky test then passes but the split-scroll one still fails (`scrollY == max == 245`), so I reverted it. A product-CSS hack to land the bar on a favourable fraction (for example a pixel `min-height` on the row) would pass but is rounding luck, so I did not add one. Suggested spec work: have SGS-133 (run-bar cap and scroll anchoring, which owns this area) or a respec of this ticket loosen those two checks (a tolerance on the sticky top; a scroll position the test sets itself instead of relying on where `fill` leaves the page). No assertion was changed here.

## Doc claims (quoted, with the code that makes them true)

- "a save panel (`save-panel`) on its own row below them, with the save buttons ... and the save status": `save-build.tsx` `SaveBuild` root, `.savePanel { flex: 1 1 100% }`.
- "in the save row": `save-build.tsx` link and Copy link are children of `save-row`.
- "Escape with focus on the link or on Copy link hides the link ...; Escape on a save button does nothing": `onLinkKeyDown` attached only to those two elements; mutation check below.
- "The link, the save status and any save error go away on the first settled change": effect clearing `saved`/`error` when `sameInput` fails; status derives from `saved`.
- "From 1200 px up the row does not wrap and the link field shrinks to fit; below that the row wraps in that order": `workbench.module.css` `@media (min-width: 1200px)`; geometry specs at 1280 and 390.
- "reads `Saved` after Save as copy and `Saved version <revision>` after Save a new version ... empty while a save is in flight, after a failed save, and whenever the link is not shown": `saveStatusText`; `showSuccess` stores the revision; `showFailure` sets `saved` null.
- "A failed save also hides the link": `showFailure` calls `setSaved(null)` when the settled input is still the one sent (a late failure after an edit leaves things unchanged, and the link is already gone by then).

## Pinned outputs

None.

## Mutation checks (all undone; tree matched the commit)

- `saveStatusText` without the `sameInput` check (`save-build.tsx`): 3 table rows failed (`text edit`, `duration edit`, `another build selected`), `AssertionError: expected 'Saved' to be ''`.
- Without the `saving ||` check: 2 rows failed (`save in flight after a create/update`).
- Removing `aria-atomic="true"` from the status: the static render case failed on `toContain('aria-atomic="true"')`.
- `onKeyDown={onLinkKeyDown}` added to `save-row`: `Escape > on Save as copy leaves the link and the status shown` failed (`toEqual({link: true, status: 'Saved'})`).
- `saveStatusText(saved, settled, false)` at the render site: `keeps the link and empties the status while a second copy is in flight` failed (expected `''`, received `Saved`).
- Not mutation-checked individually: the geometry specs, the below-the-row placement specs, the failure specs, and the lifetime specs (they passed first time against real behavior, except the two fixes noted: the 390 "directly below" tolerance was widened from 12 to 20px after measuring a 14px gap that comes from the row gap plus centring, and the select-change test needed a template label, not an index).

## Codegen, build, lint

- Codegen: none set. `next build`: ok. `tsc --noEmit` and `lint:dup` (both configs): 0 errors, 0 clones.

## Invariant check

INVARIANTS.md A1-A3 untouched (no engine, data or simulation change). S1: no cross-app imports added.

## Unverified assumptions added

None beyond the ticket's list. The spec fakes the clipboard refusal (`navigator.clipboard.writeText` rejecting via `addInitScript`), storage throwing (`Storage.prototype.setItem`) and failed saves (`stubNamed` reply 503 / `route.abort()`); the success paths use the real named-builds routes.

## Out-of-scope findings

- `acceptance/aoe4-small-screen.spec.ts:75` and `acceptance/aoe4-split-scroll.spec.ts:55` are sensitive to the run bar's sub-pixel height (see above); SGS-133 and SGS-141 will hit the same thing when the bar height changes again.
- `useRunBarHeight` rounds with `Math.ceil`, which can leave the document 1px short of the bar's page top; the M9.12 design says the hook stays unchanged, so I left it.

## Notes

- `docs` change keeps no measured values.
- Worktree creation: the first `git worktree add -b` printed only a hint and left the branch without a worktree; I added the worktree for the existing branch (no commits existed).
