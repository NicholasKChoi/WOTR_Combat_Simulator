# SGS-144 spec gate 2

Verdict: NEEDS_SPEC (one small, mechanical gap)

Read at origin/main after `git fetch origin`: workbench.module.css, step-annotation.module.css, build-text-editor.tsx grep, acceptance/aoe4-editor-width.spec.ts, acceptance/aoe4-save-status.spec.ts, docs/aoe4-build-order.md, ARCHITECTURE.md, styles/global.css, INVARIANTS.md, design/M9.md.

## Gaps

1. Invariants field - the ticket says "none (... no `Paths:` entry guards these rules)". That is false. The A1 to A3 section (INVARIANTS.md line 50) has `Paths: components/apps/aoe4-build-order/**`, and the ticket edits `components/apps/aoe4-build-order/workbench.module.css` and `step-annotation.module.css`. The field must name the entries whose Paths it touches. An implementer or reviewer reading "none" would skip the invariant check the gate requires. Proposed fix: `A1, A2, A3 (the CSS files are under their Paths; the change is CSS and docs only and touches none of them)`. The last criterion, "No INVARIANTS.md regressions", already covers it.

## Gap 1 re-spec findings: resolved

- 1199px criterion is now "DOM order and no overflow", with wrapping permitted and not asserted. This matches `.saveRow` `flex-wrap: wrap` below 1200px (workbench.module.css lines 196 to 203).
- The conditional save-row fix now names `.linkInput` `min-width` and `flex-basis` and the pass property, `scrollWidth <= clientWidth` at 1200px, with the buttons, status and Copy link unshrunk. The `min-width: 8rem` rule in the `min-width: 1200px` block is at lines 229 to 231, and `flex: 1 1 12rem` is at line 215. Both match the ticket.
- The ARCHITECTURE.md Styling bullet (line 14) exists and holds no 18px statement, so the added sentence is correct.
- On merge now lists the design lines. design/M9.md has the matching text at lines 22 (statement), 93 to 94 and 422 (save-row figures), and 512 to 513 (compact-mode rows). Line 593 (M9.8 option A text) and C14 are also named. It is a single `; `-format item.
- The two boundary criteria were merged.

## Other checks (passed)

- Grounded scope: both `@container build-editor (width < 48rem)` rules exist (workbench.module.css:113 and step-annotation.module.css:71). `.editor` carries `container: build-editor / inline-size` (workbench.module.css:43 to 47) and is the `build-order-editor` testid element (build-text-editor.tsx:69). It has no padding or border in its rule, so an inline `style.width` on that element sets the queried width directly. `COMPACT_BELOW_REM` is at editor-width.spec.ts:5. Its other uses are the boundary assertions in the 390px, 1280x800, gutter and 48rem-and-wider cases, so the "boundary assertion uses `COMPACT_BELOW_REM`" rule in Scope covers them. No other acceptance, component, doc or style file reads 48rem; the only other hit is docs/aoe4-build-order.md:889, which carries the threshold twice, as the ticket says.
- Existing 390px, 1024px and 1280x800 expectations hold at 768px, since measured editor widths are 666, 906 and 534 to 624px.
- The 768px criterion can fail against the 48rem (864px) threshold. An editor set to about 800px is compact at 864px and non-compact at 768px.
- The 1200px save-row criterion is a conditional regression guard, which is acceptable; the ticket says what to do if it fails.
- Risk low, LOC 15, Depends on none, Open questions none, no diagram needed, and no input validation involved.
- Unverified assumptions none is acceptable (real Chromium resolves rem in container queries against the root).
- No overlap with another open ticket: the TASK-GRAPH rows for SGS-140 and SGS-141, the tickets that introduced the compact mode, are integrated.
- Docs: Scope covers docs/aoe4-build-order.md and the 18px sentence. No `12rem`, `8rem` or `1200px` figure appears in docs, README or ARCHITECTURE.md.

## Notes (non-blocking)

- The criterion text "Review screenshots ... show no horizontal overflow" is a reviewer check, not a test, which is fine.
- design/M9.md lines 93 to 94 also state the `12rem` / `8rem` link-input sizes. The On merge item names the save-row figures in the C-section and the 1200px row. If the implementer changes `.linkInput`, line 94 changes too, so it should be listed there.
