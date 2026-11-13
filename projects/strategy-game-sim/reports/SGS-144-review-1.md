# SGS-144 review 1

Verdict: APPROVE (tip 75a5bf0, base origin/main 1f35bef)

## Blocking findings
None.

## Acceptance criteria
- Compact switch at 768px absolute, both container queries together: pass. Both rules now read `(width < 768px)` (workbench.module.css, step-annotation.module.css). The new "compact boundary" table (767 compact; 768 and 850 not) sets the `build-order-editor` width inline, polls the measured width to equal the target, then reads finish-time display and fonts in one `readEditor` evaluate. `(display === 'none') === compact` ties hidden finish time to the compact font. The 768 and 850 rows fail at the old 864px threshold, and the implementer's mutation run confirms it.
- Save row at 1200 and 1199: pass. `expectOneLine` checks alignment, status on the line, row height and `overflow` inside `expect.poll`, using a single `rects` evaluate. The 1199 test checks DOM order and no overflow. The 60rem mutation failed the 1200 test (overflow 500 vs 0). The 30rem mutation did not fail, so the guard only catches a large overflow (see notes).
- Docs: pass. Both `48rem` mentions in docs/aoe4-build-order.md now say 768px, and a grep finds no `48rem` or "16px" left in docs, ARCHITECTURE.md, components or acceptance. The ARCHITECTURE.md Styling bullet states the 18px root, which matches `styles/global.css` `font-size: 18px`.
- Edited pre-existing tests: pass. Only the bound expressions changed (`COMPACT_BELOW_REM * m.rem` -> `COMPACT_BELOW_PX`) plus the describe rename. Expected values are unchanged and the implementer lists each. The 1280 one-line test was refactored into the `expectOneLine` helper with identical assertions.
- `npx tsc --noEmit` and `npm run lint:dup`: pass, run by me (0 clones). `npm test` and `next build`: the implementer reports they pass; I did not rerun them.
- Review screenshots at 360x760, 768 and 1280: unverified. I did not run the UI inspection. The diff changes only a container-query threshold, and per the ticket no real viewport puts the editor between 768 and 864px, so there is no rendered change to inspect. The `commands.preview` server was not started.
- INVARIANTS A1 to A3: hold. The diff is CSS, tests and docs only.

## Contract, conventions, correctness
- No scope creep: the compact levers, step table and root font size are untouched.
- No invented constants. `COMPACT_BELOW_PX` matches the owner's decision.
- Tests follow the existing table and helper style. The LESSONS rule on single-evaluate layout reads is respected.
- Doc claims verified against the CSS.

## Non-blocking notes
- The `.linkInput` `min-width: 8rem` guard at 1200px only fails for a large overflow (60rem fails, 30rem does not). That follows from the row having spare width at 1200px, not from a test defect.
- Bot review: `reviewBot.cli` is empty, so section 3 was skipped.

## Coverage
Reviewed the full diff (7 files) and the surrounding spec code in `aoe4-editor-width.spec.ts` and `aoe4-save-status.spec.ts`. I ran no acceptance tests, per the gate rules. On merge, the manager updates design/M9.md as the ticket lists; the save-row figures stay unchanged.
