# SGS-133 spec gate 1

Verdict: NEEDS_SPEC

Read at origin/main (SGS-132 has no local branch, so its layout was read from the ticket only).

## Gaps

1. **Acceptance criteria 3-5 (case b/c precondition) - may not hold after SGS-132, so the spec could fail on a correct implementation.**
   The design's "about half of 720px" measurement was taken on the pre-SGS-132 wrapped save row. SGS-132 puts the save controls on one row at 1280, which makes the bar shorter. The existing my-builds test "layout of the save panel" already asserts the bar is at most 0.4 of the viewport at 1280x720 with the copy form open, so the cap is not reached by that state alone. The ticket requires `scrollHeight > clientHeight` as the first assertion at 1280x720 with the copy form, link and storage warning open. If content is under 288px there, the implementer must guess a different state or viewport, and the "fails with the cap removed" claim is false.
   Fix: either state a rule for the state ("open enough run-bar content at 1280x720 that the content exceeds the cap, assertion first") and let the implementer add content to get there, or confirm the measurement on the SGS-132 branch tip and cite it. Use the same wording for case (c). The implementer should not tune the viewport. The design fixes 1280x720, so this may need an `owner` or designer call if the state cannot exceed the cap.

2. **Scope, `overflow-anchor` placement - rule not checkable by the implementer.**
   Scope leaves placement open, "chosen by what makes case (a) pass", which is acceptable. The risk is a rule that passes (a) by luck. `overflow-anchor: none` on a descendant only excludes that subtree from anchor candidates. Chrome may then pick a sibling or later element as anchor, so (a) could pass or fail on layout details. The Unverified assumptions field says the property goes "on the element that holds the anchor candidates" but Scope does not name which one.
   Fix: add to Scope that the rule goes on the nearest ancestor of both the run bar and the split (the page section), and that if (a) still fails it moves to the scroller's root through a `:global` rule on the document. Also state that the mutation run removes the rule from wherever it was placed.

3. **Scope, test helpers - unnamed dependency on SGS-132.**
   "Reuse the helpers SGS-132 left in `acceptance/helpers.ts`" names none. SGS-132 only says it moves a helper "when the new spec needs the same helper". The implementer cannot tell what exists, and the acceptance jscpd gate fails on a clone.
   Fix: name the flow needed (save a copy, reopen the copy form, storage throwing, via `saveCopy` / `refused`-style init script in `aoe4-my-builds.spec.ts`). Say that if SGS-132 left no shared helper, this ticket moves `saveCopy` and the throwing init script into `acceptance/helpers.ts` and imports them in both specs.

## Notes (non-blocking)

- Checks that passed. `.runBar` and `.workbenchSplit` exist; the static rule is in the existing `max-width: 767.98px` block; `useRunBarHeight` reads `getBoundingClientRect().height` plus margin as the ticket says; `save-copy-cancel` exists in `save-build.tsx`; `SPLIT_VIEWPORT`, `scrollInstantly` and `expectNoRun` exist in helpers; the existing run-bar-height test is in the spec.
- Docs: the doc statements Scope names are at `docs/aoe4-build-order.md` lines ~873 (stays at top of viewport) and ~921 (run bar scrolls with the page). Both are correct to list. Line ~1088 ("in the run bar") belongs to SGS-132.
- `overflow-y: auto` also makes `overflow-x` compute to `auto`. Add a criterion or note that the bar shows no horizontal scrollbar at 768 and 1280, and that focus rings are not clipped at the bar's edges.
- Case (c): "the bar's last focusable control" assumes the copy form is open together with the link. State the steps (save, then open the copy form again) so the implementer does not guess whether the link survives.
- The `auto-run-status` "reachable by scrolling" criterion has no observable check beyond the test id. Rewrite as: after setting `scrollTop` to its maximum, the `auto-run-status` rect lies inside the `run-bar` rect (if it is shown at that state).
- Risk `standard`, size, Depends-on, On merge `none`, Invariants `none` (no INVARIANTS Paths touch CSS or acceptance specs that I found), and no open questions: all fine. No input validation, no overlap with another open ticket (SGS-141 only depends on this one).
- I ran no tests; the ticket's checks are browser-based and the dependency is not built locally.
