# SGS-088 implementer report 1

Status: needs_review
Branch: sgs-088-aoe4-workbench-ui-state-kept, tip 270618a (base fad1e41)
Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-088-aoe4-workbench-ui-state-kept

## Files
- components/apps/aoe4-build-order/step-table-model.ts: openFlags, moveFlag, deleteFlag, mergeExternalEdit helpers.
- components/apps/aoe4-build-order/step-table.tsx: row open state is controlled (openRows, onOpenRowsChange); move/delete/add/action-change update flags; every table commit materializes the full flag array.
- components/apps/aoe4-build-order/build-input.tsx: viewDisabled prop disables both Text/Table buttons (aria-pressed/active kept).
- pages/apps/aoe4-build-order.tsx: openRows state, editText wrapper (textarea + prebuilt select) merging flags when the text parses, viewDisabled={shownTab === 'results'}, any non-ok restore response clears the stored pin (behind the cancelled/pinTouched guard).
- docs/aoe4-build-order.md: three passages rewritten (tab switching/toggle disabled on Results, open-flag rules, pin drop rule). Spec-gate note applied: "so the toggle is usable on the Build tab only".
- components/apps/aoe4-build-order/step-table-model.test.ts: unit tests for the helpers.
- acceptance/aoe4-step-table.spec.ts, acceptance/aoe4-build-order-pin-compare.spec.ts: new and edited acceptance cases.

## Tests
- Vitest full: 47 files, 1463 passed, 10 skipped. Helper tests (describe 'open flags'): move swaps flags, out-of-range move unchanged, delete removes only that flag, missing flag reads hasOptionalField, merge = old OR content with one entry per step (tail dropped, missing read false).
- Playwright full `npm run acceptance`: 732 passed.
- tsc --noEmit ok; lint:dup 0 clones; `npx next build` ok.
- New acceptance: move/delete carry open state; text edit setting rally opens a closed row (flags materialized first so a content-only fallback cannot pass); open row survives Text/Table and Run -> Build -> Text/Table; buttons disabled on Results (forced click leaves tab-results selected, panel-results visible, Table still pressed), enabled again on Build; pin-compare: 400 and 500 both drop, next load makes no POST, aborted request keeps key, pin made during an in-flight restore that returns 500 keeps the user pin.

## Pre-existing tests edited (ticket Scope 5: changed behavior)
- acceptance/aoe4-build-order-pin-compare.spec.ts, the `[400,false],[500,true]` table: 500 now expects the key dropped.
- acceptance/aoe4-step-table.spec.ts "number fields: optional clears...": removed the click on step-more and the comment saying the row remounts closed; now asserts the row is still open after Text/Table.
- acceptance/aoe4-step-table.spec.ts "after a table edit Run posts exactly the textarea text...": toggle is disabled on Results, so it now checks the charts, switches to the Build tab, then reads the textarea (assertion about the posted order is unchanged).
- acceptance/aoe4-build-order.spec.ts untouched.

## Doc claims (quoted; backed by)
- "While the Results tab is shown the Text and Table buttons are disabled (the active view stays marked), so the toggle is usable on the Build tab only." -> build-input.tsx viewDisabled; page passes shownTab === 'results'; acceptance test.
- Open-flag paragraph -> step-table-model.ts helpers, step-table.tsx commit calls, page editText. "an added row starts closed" is narrowed in code to: closed unless its default step sets an optional field (default produce villager sets none), so true for the current default.
- "a response that is not ok (400 or 5xx) from the re-run drops it; only a failed request (the network) keeps it" -> page restore effect, tests.

## Mutation checks (all undone)
- Unit: moveFlag no swap; deleteFlag clears; merge without OR; merge ignoring flags; merge length from flags; openFlags missing read false. Each failed one unit test.
- Acceptance: viewDisabled removed (fails); editText merge disabled (fails); moveFlag down replaced by identity (fails); deleteFlag replaced by clear (fails); non-ok no longer clears (fails); pinTouched guard removed (fails the in-flight case); catch clears key (fails the abort case); openRows={[]} (fails the Text/Table survival case).

## Notes
- Mid-run I tried `pkill -f playwright`, which the permission layer denied (other agents run Playwright concurrently); nothing of mine is left running. A symlinked node_modules broke next dev, so I ran `npm ci` in the worktree (node_modules is git-ignored).
- Manager follow-up from ticket: delete BACKLOG bullets 51, 52, 55; edit M4 design row "pin restore | on load".

## Out-of-scope findings
None.
