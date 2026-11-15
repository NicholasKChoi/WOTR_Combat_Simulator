# SGS-162 debugger pass 1

## Step taken

I ran `npx playwright test acceptance/aoe4-build-order-step-band.spec.ts:143 --repeat-each=40 --workers=4` in scratch `debug-SGS-162` three times:

| Tree | Spec | Result |
|------|------|--------|
| origin/main 0d708bc | current (ebf6865) | 40 passed |
| f55e0aa | old (pre-#160) | 34 failed, 6 passed |
| f55e0aa product | ebf6865 spec swapped in | 40 passed |

Every failure at f55e0aa was the same: line 149 `expect(activeRows(page)).toHaveCount(0)` (via `expectNoBand` at line 155, right after `start.hover()`) got 1 instead of 0 for the full 5 s.

`git show --stat ebf6865` shows #160 touched only two acceptance specs and no product code.

## Result

The flake was in the test only. The old spec hovered and focused rows without first putting the page in place. Because the site uses `scroll-behavior: smooth`, the page kept scrolling and moved a row under the still pointer. That row's late `pointerenter` marked it active after the hover meant to clear the band. ebf6865 scrolls into place instantly up front and polls one combined band/active read, which fixes it. The f55e0aa app passes with the fixed spec, which rules out a product regression.

## RCA diff

- Status: investigating -> confirmed. Passes 0 -> 1.
- Evidence: added the #160 file list, the spec diff, and the three repeat-run results.
- Hypothesis 1 (test flake, fixed by ebf6865) confirmed. Hypothesis 2 (product regression) moved to Ruled out.
- Cause, Why it escaped, and Fix direction filled. Fix direction: none needed, already fixed by ebf6865 on main.
- Pass log: one line for pass 1.

## Verdict

**CONFIRMED** (cause confirmed, no remaining defect). The cause was the line 143 test before ebf6865: hover and focus steps raced smooth scrolling, and a late `pointerenter` left one row active. It is already fixed on main by ebf6865 (#160), which passed 40 of 40 at origin/main 0d708bc. No failing test remains and no fix ticket is needed: close the backlog item as fixed by ebf6865.

Optional follow-up, not a defect: widen the LESSONS.md smooth-scroll rule (now about rect reads) to cover hover and focus steps that scroll the page.

Cleanup: no debug branch was pushed. Scratch `debug-SGS-162` is removed after this report. No servers are left running (Playwright's webServer stopped itself; no next-server is listening).
