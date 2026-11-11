# SGS-115 implementer 3 (re-spec 2)

- Ticket: SGS-115. Branch: sgs-115-split-scroll. New tip: df77e2ef694ca7ee23e2f276839176250b0a7d58 (was 637e1ad).
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-115-split-scroll

## Files touched
- `acceptance/aoe4-split-scroll.spec.ts` line 67: precondition replaced verbatim with
  `await expect.poll(() => page.evaluate(() => window.scrollY < document.documentElement.scrollHeight - window.innerHeight)).toBe(true)`.
  The identical old-style check at line 153 belongs to the below-1200 px test (criterion 6) and is intentionally unchanged.
- No production code changes. No pre-existing tests edited.

## Runs
- Spec with the new precondition, CSS intact: `aoe4-split-scroll.spec.ts` 10 passed.
- Mutation: removed `overscroll-behavior: contain` from `.column` (`components/apps/aoe4-build-order/workbench.module.css:26`), ran
  `npx playwright test acceptance/aoe4-split-scroll.spec.ts -g 'each column scrolls'`. Failing output:

```
1) [chromium] > acceptance/aoe4-split-scroll.spec.ts:55:7 > ... > each column scrolls on its own
    Error: expect(received).toBe(expected) // Object.is equality
    Expected: 194
    Received: 245
      73 |       const after = await scrollTops(page)
    > 74 |       expect(after.page).toBe(before.page)
  1 failed
```
  This is the `window.scrollY` "unchanged" assertion. CSS restored (git diff shows only the spec line); committed tree has the rule.
- After restore: `npx tsc --noEmit`, `npm run lint:dup` clean; `aoe4-split-scroll`, `aoe4-split-layout`, `aoe4-small-screen`: 28 passed.
- Not re-run this pass: `npm test` (no unit code touched) and `next build`.

## Doc claims
None added or changed.

## Notes
- use-run-bar-height.ts null-ref / missing ResizeObserver behavior unchanged from earlier passes (checked by reading, not touched here).

Status: needs_review
