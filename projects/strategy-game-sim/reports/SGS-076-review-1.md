# SGS-076 review 1

Verdict: APPROVE. Tip cda1497 (one commit on origin/main ebc063d). Review bot: none configured (reviewBot.cli empty).

## Blocking findings
None.

## Acceptance criteria
- [x] results-split has exactly two children, both always rendered, no test id (results.tsx: two plain `div`s with className only; StepTimeline returning null leaves the timeline div present). No spec asserts this; verified by reading the code.
- [x] Side by side at 1280x800: spec case passes (run by me).
- [x] Sticky below run bar: passes; implementer's mutation checks (no sticky, top: 0, no observe) fail it.
- [x] Wrapped run bar: passes; ResizeObserver on the run bar sets --run-bar-height from getBoundingClientRect().height (border box, as Scope 3 says).
- [x] 1024x768 stacked: passes.
- [x] scrollWidth <= 1280: passes.
- [x] Spec reads rects only inside page.evaluate wrapped in expect.poll; no boundingBox().
- [x] Narrow-layout spec: 390 px tests unchanged and pass; 1280x720 checks compare-scroll; 1024x768 checks step-timeline-scroll.
- [x] Only results-split added as a test id; no id/aria/data attribute changed.
- [ ] Full suites: I ran only the two touched specs (12 passed), tsc clean, lint:dup clean. Implementer reports 696 acceptance and 1318 unit passing; not re-run by me.
- [x] Docs "Page" updated with both sentences.
- [x] No INVARIANTS regressions (S1 holds: CSS variable is set on the page section, styles stay in the component dir).

## Judgement on the flagged notes
1. align-self: start. The criterion is a defect, not the code. With max-height: calc(100vh - bar) the stretched item is capped at less than the row height whenever the charts column is taller than the viewport, so it still sticks. The claim "a missing align-self: start means the column never sticks" is wrong in that case. Keep the property: Scope 2 requires it, it makes a short timeline hug its content rather than stretch, and it keeps sticky working if max-height is ever changed. Action for the manager: reword the sticky criterion and spec case "Catches" line to drop the align-self claim (ticket text only; no code change).
2. Legend as top-edge proxy. Still tests what the criterion means. step-timeline-legend is the first child of the sticky column's only content (step-timeline.tsx:38-39, inside div.mb-3, above step-timeline-scroll), so its top equals the sticky column's top, and it is the visible top edge of the timeline. The right and bottom edge checks still use step-timeline-scroll. Using scroll-box top would break because the legend row (about 54 px) was added after the ticket was written. The ticket's "step-timeline-scroll's top" wording is stale and should be updated to the legend. Mutation (top: 0) still fails the two sticky cases per the implementer.
3. Narrow-layout edit follows Scope 7 exactly (compare-scroll at 1280x720, step-timeline-scroll moved to a 1024x768 describe, 390 px tests untouched).

## Invariants
S1 holds. No others adjacent.

## Linter
npx tsc --noEmit clean; npm run lint:dup clean (Node 24.22.2). No other lint command in REPO.md.

## Bot reconciliation
No bot configured; nothing to reconcile.

## Non-blocking notes
- docs/aoe4-build-order.md: the edited step-timeline paragraph's first line is now about 150 characters; the surrounding text wraps near 120. Rewrap when convenient.
- No test covers criterion 1 (empty steps still renders both columns). Acceptable: markup is unconditional.
- The sticky column has overflow-y: auto and max-height; the spec does not test vertical scroll inside it. Not required by the ticket.
- Sibling comparison: spec style follows aoe4-narrow-layout.spec.ts (helpers, describe/test.use viewport); results.tsx chart props unchanged apart from indentation.
- REPO.md checklist: UI screenshots at 360/768/1280 not taken by me; layout was verified via the polled rect specs at 1280 and 1024, and the 390 px specs pass. 700 px not separately checked (grid rules are inside min-width: 1200px, so below it the wrappers are plain blocks).

## Coverage
Reviewed all six changed files plus step-timeline.tsx and narrow-layout spec context. Ran tsc, lint:dup, and the two touched specs. Did not run the full unit or acceptance suites, nor next build. Worktree removed; no dev server left running.
