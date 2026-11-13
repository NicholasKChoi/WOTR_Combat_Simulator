# SGS-144 spec gate 1

Verdict: NEEDS_SPEC

Read at origin/main (after `git fetch origin`). Checked the ticket against workbench.module.css, step-annotation.module.css, docs/aoe4-build-order.md, the editor-width and save-status specs, design/M9.md C14 and the save-row rules, REPO.md, and LESSONS.md.

## Gaps

1. Acceptance criteria (save row, 3rd) - "At 1199px the row wraps in DOM order" has no basis in the CSS. Below 1200px `.saveRow` is `flex-wrap: wrap`, which wraps only when the content overflows. The buttons, status, a 216px link input (12rem at 18px) and Copy link probably fit on one line at 1199px, since the editor column is ~900px or wider there. The design (M9 lines 422-423) says only that the row wraps in DOM order, meaning wrapping is permitted. An implementer would either write an assertion that cannot pass or force a wrap by changing the CSS. Proposed fix: drop the "wraps at 1199px" assertion. Replace it with "at 1199px `save-row` children keep DOM order (`save-status` directly after the buttons) and the row has no horizontal overflow." If a wrap check is wanted, state the width at which it must occur, for example "at 390px the status is on the buttons' line or the line below" (the existing M9 row for 390x844).

2. Scope (save row, conditional fix) - "fix the save-row sizes only if it fails" gives no target. The design's one-line rule says only "the link input shrinks to `min-width: 8rem`", and that figure is the 16px assumption this ticket audits. An implementer who sees a failure at 1200px would choose the sizes by guess. Proposed fix: state the property, for example "the row stays on one line at 1200px with `scrollWidth <= clientWidth`; if it fails, reduce `.linkInput` `min-width` or `flex-basis` until it holds, keeping the buttons, status and Copy link unshrunk."

## Passed checks

- Grounded scope: both `@container build-editor (width < 48rem)` rules exist (workbench.module.css:113, step-annotation.module.css:71). The container is declared at workbench.module.css:46. `COMPACT_BELOW_REM` is at editor-width.spec.ts:5. The `48rem` text in docs/aoe4-build-order.md is on line 889, as two occurrences on one line. The 18px root is at styles/global.css:8. `acceptance/aoe4-save-status.spec.ts` exists and covers 1280 and 390 only. The `.linkInput` and `.copyNameField` rem values match the ticket.
- Stale-test check: `COMPACT_BELOW_REM` is used at spec lines 82, 90, 99 and 140, plus the describe title `at 48rem and wider`. Scope covers these by rule ("tests whose boundary assertion uses `COMPACT_BELOW_REM`"), not by a list of today's tests. No other spec reads the 48rem threshold (a grep of acceptance, components and docs found none). aoe4-compact-view.spec.ts is unrelated.
- The 390px, 1024px and 1280x800 expectations hold at a 768px threshold. The measured widths are 666, 906 and 534-624px, none between 768 and 864px.
- The "fails against 864px" criterion can fail, since an editor set to 800px is compact at 48rem and non-compact at 768px.
- Invariants: none apply, which is plausible for CSS and docs.
- Risk low, LOC, dependencies, Open questions (none, with Q65 folded in) and the lack of a diagram are all fine.
- On merge is a single `; `-format item.
- Unverified assumptions: none is acceptable, since the acceptance specs run in real Chromium.
- No input validation is involved.
- No overlap with another open ticket.
- Docs: Scope covers docs/aoe4-build-order.md and the 18px sentence.

## Notes (non-blocking)

- design/M9.md C14 literally says `max-width: 47.99rem` and "below 48rem" (also lines 22, 512, 513 and 593). The ticket's phrase "matching design M9 C14" and Source line should say "matches the design's 768px pixel intent". The On merge item already updates C14, the M9.8 row and the compact-mode rows. Also list line 22, the Q-text at 593 and the 512/513 compact rows by name so none is missed. The "18px root basis" sentence should also cover the save-row 8rem figure at line 422.
- Criteria 1 and 2 overlap. Both read the finish-time display and font on each side of the boundary, so merging them into one case is cheaper.
- "ARCHITECTURE.md (or the AoE4 doc, wherever CSS conventions live)" leaves the placement to the implementer. ARCHITECTURE.md line 14 holds the Styling convention, so name it there.
- To set the editor width directly, set `style.width` on the `build-order-editor` element. The container query reads that element's inline size, so the approach is feasible. The criterion already leaves the method open, which is fine.
