# SGS-150: Deflake the run-bar small-screen and step-band acceptance specs

- **Type**: Chore
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: low
- **Risk**: low
- **Invariants**: none
- **Unverified assumptions**: none
- **LOC estimate**: 40 (test and acceptance-helper edits only; no business logic)
- **Depends on**: none
- **On merge**: none
- **Source**: owner backlog triage Q64 (2026-11-12): `aoe4-small-screen.spec.ts` failed once in a full acceptance run (1 of 734) and passed alone; `aoe4-build-order-step-band.spec.ts` failed once in a large parallel batch and passed 13 of 13 alone.

## Context

Two AoE4 acceptance specs fail rarely under load and pass alone, which costs reruns and hides real failures. The backlog names them by line (`:42`, `:143`) and by an older title; at `origin/main` the lines have moved, and the small-screen test has been renamed. This ticket makes both tests wait on the state they assert instead of sampling once, without weakening what they check.

### Specs at main

- `acceptance/aoe4-small-screen.spec.ts`: the test titled "scrolls the results heading into view" no longer exists. The test in `describe('run bar at 360x760')`, "scrolls away with the page, and a run does not scroll the page by itself", is the successor (the same scroll and run-bar behavior at that viewport), so it is the target. The other tests in the file are not reported as flaky.
- `acceptance/aoe4-build-order-step-band.spec.ts`: the test at the reported line now is "the start row clears a band set by the other input, hovering over a focused row and focusing under a hovered row".

### Likely causes (read from the specs, not reproduced; the implementer confirms by reproduction)

Small-screen test:
- `scrollInstantly(page, 400)` runs right after `openPage`, then `expect(before).toBeGreaterThan(0)` and `expect(await settledScrollY(page)).toBe(before)` read the scroll position once. When the page is not yet at full height (the initial auto-run and chart layout still landing under load), the clamp on `window.scrollTo` can give a smaller or zero value, and a late layout change can move `scrollY` after the single two-frame read.
- After `showTab(page, 'results')`, the poll scrolls to 400 and returns, and the following `page.evaluate` that measures the run bar and result titles is a separate read. A layout shift or scroll clamp between the two reads makes `barTop` or the overlap count stale. The Lessons rule on layout checks (one evaluate per read, or poll) applies to this pair.

Step-band test:
- The test mixes pointer state and focus: it moves the mouse to the corner, focuses a row control, hovers the start row, focuses `duration-seconds`, hovers a step row, then focuses a start-row control. Each `hover()` and `focus()` can scroll the page, and the pointer then sits over a different element than it did. Chromium updates hover state after the scroll on a later frame, so a band or `data-active` can be set or cleared after the preceding assertion already passed. The checks `expectNoBand` and `toHaveCount(CHART_IDS.length)` each pass on their first matching sample, so a late hover event can land after one passes and break the next step.
- `bands(page)` counts the charts' step bands while recharts may redraw them; several tests in the file read them with `toHaveCount`, which retries, but the sequence above does not wait for the pointer and focus state to settle between steps.

## Scope

- In `acceptance/aoe4-small-screen.spec.ts`, rewrite the run-bar 360x760 test so each position or layout read waits for the page to be ready and is taken in one `page.evaluate` or inside `expect.poll`: the scroll to the target offset is confirmed to have taken effect (the page is tall enough) before `before` is compared, and the run-bar position and result-title overlap are read in one evaluate. Keep the existing checks: the bar is `static`, scrolls away with the page, a run does not move the page, the Build tab stays selected, and no result title is covered by the bar. Reuse `scrollInstantly`, `settledScrollY`, and `setDurationInPlace` from `acceptance/helpers.ts`, and change them only if the fix needs it.
- In `acceptance/aoe4-build-order-step-band.spec.ts`, make the start-row test settle pointer and focus state between steps, for example by asserting the final state with `expect.poll` over a single evaluate, or by moving the pointer and waiting on the resulting state before the next input. Keep the five transitions it covers (hover over a focused row, focus under a hovered row, in both directions to a cleared state).
- Before editing, reproduce each flake with the single spec run repeatedly under parallel load (Playwright `--repeat-each` with several workers, or the spec run beside other specs), and record the failure message and the confirmed cause in the PR body. When a cause above is wrong, fix the one reproduced, and say so. When a flake does not reproduce, apply the hardening for the likely cause, and say it was not reproduced.
- Grep the other tests in both files for the same pattern (a scroll or hover followed by a separate, one-shot read of layout or hover state) and fix those found in the same way. Name them in the PR body.
- Add a LESSONS.md entry only if the confirmed cause is a rule the existing layout-reads lesson does not already cover; the implementer reports it instead of editing LESSONS.md.

**Out of scope:** production code, the Playwright config (workers, retries, timeouts), other specs, skipping or retrying tests to hide the flake, weakening or deleting an assertion.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] Both named tests still assert everything they asserted before (run bar static and scrolling away, a run not scrolling the page, no result title under the bar, and the start-row clearing a band in both directions); no assertion is removed or loosened to a weaker one. Pre-existing tests in both files keep their assertions.
- [ ] In the small-screen test, a layout read (scroll position, run-bar position, title overlap) is taken either in one `page.evaluate` or inside `expect.poll`, and the test does not compare a scroll offset against a value read before the page could reach that offset.
- [ ] In the step-band test, each step waits for the hover and focus state it just caused to settle before the next input, so a hover state that lands a frame late cannot make a later assertion pass or fail by chance.
- [ ] Each fixed test still fails for the behavior it guards: breaking the behavior (for example the run bar becoming sticky at 360 px, or the band not clearing when focus moves to the start row) in a throwaway worktree makes the test fail. The implementer states which break was tried for each.
- [ ] Each of the two tests passes in a repeated run under parallel load, with no failure, and the implementer records the repeat count, worker count, and result in the report. The PR body gives the reproduced cause for each flake, or says it did not reproduce.
- [ ] `npx tsc --noEmit` passes; no production file changes.
- [ ] No INVARIANTS.md regressions

## Open questions

none
