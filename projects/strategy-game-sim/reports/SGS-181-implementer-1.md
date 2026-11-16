# SGS-181 implementer report 1

- Ticket: SGS-181. Branch: sgs-181-width-row-specs-editor-annotations-chart-views. Tip: baa121f23b0496fc3e3316429bc3a8f58bc0b1c7 (base origin/main f731e4a, includes SGS-179).
- Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-181-width-row-specs-editor-annotations-chart-views
- Status: needs_review

## Files touched
- acceptance/aoe4-editor-width.spec.ts: rows over `[MIN_SUPPORTED_VIEWPORT, WIDE_VIEWPORT]`, boundary cases deleted, constants and imports cleaned.
- acceptance/aoe4-step-annotations.spec.ts: popover loop rows, run-cell describe at default viewport, `showTab` removed.
- acceptance/aoe4-chart-views.spec.ts: tick loop rows, `showTab` removed.

## Cases edited, renamed, moved, deleted
aoe4-editor-width:
- renamed and moved to MIN_SUPPORTED_VIEWPORT: "at 390 px the textarea keeps half of the editor" -> "the textarea keeps half of the editor at the minimum supported viewport"; dropped `editorWidth < COMPACT_BELOW_PX`.
- "at 1280x800 the textarea content fits a typical build line" -> rows "at ${width} px the textarea content fits a typical build line" (1200, 1800); precondition dropped.
- "at ${width} px the gutter drops the finish time..." loop `[PHONE, SPLIT_VIEWPORT]` -> `[MIN_SUPPORTED_VIEWPORT, WIDE_VIEWPORT]` (1200, 1800); precondition dropped, other assertions unchanged.
- "the step table and the table view keep the finish time in compact mode" -> "...keep the finish time", default viewport.
- "hovering an annotation still marks the active step in compact mode" -> "hovering an annotation marks the active step", default viewport.
- deleted: describe "AoE4 text editor at 768 px and wider" ("keeps the M8 layout"); describe "AoE4 text editor compact boundary" (767/768/850 rows).
- "AoE4 Build panel has no horizontal overflow": rows 360/768/1280 -> 1200/1800 (`SUPPORTED_VIEWPORTS`), body unchanged.
- Removed `PHONE`, `COMPACT_BELOW_PX`, `TABS_VIEWPORT`/`SPLIT_VIEWPORT` imports. `expectFonts` lost its `editorRem` parameter (only the 0.875 call remains; value is now a local const).

aoe4-step-annotations:
- popover loop `[360, 768, 1280]` @760 -> `[MIN_SUPPORTED_VIEWPORT, WIDE_VIEWPORT]`, viewport set from the row; title still names the row width.
- describe "AoE4 step run cells in the narrow card layout" -> "AoE4 step run cells", `test.use` viewport dropped (default viewport).
- All `showTab` calls and the import removed (setText, gutter and aria-hidden cases, openText, invalid-edit case). Reads that followed were already behind `showView` clicks (auto-wait) or `toBeVisible`.
- `SPLIT_VIEWPORT` stays imported: the "step table layout beside Results" describe (line ~451, not in this ticket's list) uses it. Not changed; belongs to a sibling ticket.

aoe4-chart-views:
- tick-overlap loop `[360, 768, 1280]` @900 -> `[MIN_SUPPORTED_VIEWPORT, WIDE_VIEWPORT]`; title still ends "at ${viewport.width} px wide"; assertions unchanged.
- 17 `showTab` calls and the import removed. Following reads are `expectPressed`/`yLabel`/`line` expects, `option().click()` (auto-wait) or `expect(...).toBeVisible` inside the tick loop.

Height note: the chart tick and popover loops now use each row's own height (800 and 900) instead of 900 and 760. Assertions do not depend on height; the popover case scrolls lines into view instantly, so it is unaffected.

Pre-edit grep hits (showTab, TABS_VIEWPORT, PHONE, setViewportSize, viewport:) were all listed in the ticket, plus the `SPLIT_VIEWPORT` describe above (1280, supported, left alone).

## Tests
- `acceptance/aoe4-editor-width.spec.ts`: 9 passed.
- `acceptance/aoe4-step-annotations.spec.ts`: 24 passed.
- `acceptance/aoe4-chart-views.spec.ts`: 13 passed.
- `npm test`: 84 files passed, 1 skipped; 2623 passed, 15 skipped.
- Pre-existing tests edited: only the specs above, as the ticket directs; no assertion changed except removal of the compact-boundary preconditions the ticket names.

## Mutation check
- Half-editor case: changed `0.5 * m.editorWidth` to `0.99 * m.editorWidth` (aoe4-editor-width.spec.ts:81); failed with "Expected: >= 528.66, Received: 464"; reverted (grep confirms 0.5, committed tree clean). Other rewritten cases keep their assertion bodies verbatim and were not individually mutated.

## Build and lint
- `npx tsc --noEmit` clean; `npm run lint:dup` 0 clones. `next build` not run (test-only change, no page code). No codegen.

## Doc claims
None added. Comments added: none.

## Invariants
None apply (acceptance specs only).

## Unverified assumptions
None added.

## Out-of-scope findings
- `acceptance/aoe4-step-annotations.spec.ts` "AoE4 step table layout beside Results" still uses `SPLIT_VIEWPORT` (1280x800); supported width, but sibling tickets may want to move it to the new constants.
