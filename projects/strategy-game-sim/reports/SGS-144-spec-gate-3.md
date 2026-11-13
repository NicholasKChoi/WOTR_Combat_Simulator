# SGS-144 spec gate 3

Verdict: READY

Read at origin/main after `git fetch origin` (the checked-out branch is a debug branch, so files were read with `git show` and `git grep` against origin/main).

## Gate 2 gap: resolved

The Invariants field now lists A1, A2, A3. Their `Paths:` cover `components/apps/aoe4-build-order/**` (INVARIANTS.md), which holds both CSS files. The stated reason, that the change is CSS, tests and docs only and touches none of the data-file numbers, non-negative resources or deterministic timings, is accurate.

## Re-checked

- Both `@container build-editor (width < 48rem)` rules exist: workbench.module.css:113 and step-annotation.module.css:71. `styles/global.css` sets `font-size: 18px`.
- `.linkInput` and `.copyNameField` `flex: 1 1 12rem` are at workbench.module.css:215. `min-width: 8rem` is inside the `min-width: 1200px` block (lines 220 to 230). Both match the ticket.
- `COMPACT_BELOW_REM` is at acceptance/aoe4-editor-width.spec.ts:5, used at lines 82, 90, 99 and 140. The describe title "48rem and wider" is at line 135. Scope's rule ("tests whose boundary assertion uses `COMPACT_BELOW_REM` change") covers all of them.
- The only other `48rem` hit outside design docs is docs/aoe4-build-order.md:889, which carries the threshold twice, as the ticket says. No other doc states the root size. ARCHITECTURE.md line 14 is the Styling bullet.
- design/M9.md still carries every figure On merge lists: lines 22, 321, 512, 513, 593, plus the conditional 94 and 422. The On merge field is a single `; `-separated item.
- Existing 390px, 1024px and 1280x800 expectations hold at the 768px threshold. Measured editor widths are 666px, 906px and 534 to 624px.
- The 768px criterion can fail against 864px: an editor between 768px and 864px is non-compact at 768 and compact at 864.
- The save-row criterion is a conditional regression guard with a named fix and pass property.
- Risk low, LOC 15, Depends on none, Open questions none, no diagram trigger, no input validation, Unverified assumptions none (real Chromium).
- No overlap with another open ticket.

## Gaps

None.

## Notes (non-blocking)

- The `Review screenshots ... no horizontal overflow` criterion is a reviewer check, not a test. That is acceptable.
