# SGS-170 spec gate, round 2

**Verdict: READY**

Checked at origin/main after `git fetch origin`.

## Checks

- **Grounded scope.**
  - `AnnotationLine`, the `title` attribute, `onPointerEnter`/`onPointerLeave`, `onCaret`, `onBlur` and the `aria-hidden` gutter `<ol>` all exist in `build-text-editor.tsx`.
  - `waitedText` and `STILL_WAITING` exist in `step-annotations.ts`.
  - The paragraph at `docs/aoe4-build-order-ui.md` line 19 holds the "hovering the annotation shows the time it waited" sentence and the last-wins sentence, so the docs target is now correct.
  - `.annotations li` has `overflow: hidden`, the column is 17ch (4.7ch compact), and `.editor` sets `container-type: inline-size`, as the ticket says.
- **Hover and caret rule.**
  - `onCaret` sets `activeStep` from the caret line, or null for a line with no run.
  - `onBlur` sets it to null.
  - Pointer enter and leave write the same `activeStep`.
  - The ticket's rule matches: the popover follows `active`, the last event wins, and the caret line is not restored on leave. Criteria 4 and 5 pin it.
- **Title text.** The current title is "Waited <t>. Blocked by: <x>" or "Still waiting. Blocked by: <x>", with `nothing` when empty. The ticket's description matches.
- **Existing tests.**
  - The only test reading `title` is `acceptance/aoe4-step-annotations.spec.ts:144-165`, and Scope names it.
  - No unit test renders `BuildTextEditor`, so a portal under `renderToStaticMarkup` is not a risk.
  - Other tests that read `li.textContent`, `:scope > span` or scrollWidth are protected by the portal requirement.
- **Docs.** Line 174 ("the text view's gutter annotations ... Pointing at a row ...") stays true. No other mention of the gutter title exists in the docs.
- **Other checks.** Invariants none, no dependencies, open questions none, On merge `none`, LOC about 80. Unverified assumptions `none` is correct: the popover uses no external service. Risk `low` is acceptable, since no `criticalPaths` symbol is touched.

## Notes (non-blocking)

- The popover is positioned from the line rect at show time. A caret-driven popover for a line scrolled off-screen, or a page scroll or resize while it is shown, can leave it stale or off-screen. Criterion 7 ("fully inside the viewport") already tells the implementer to clamp. Recomputing the position on scroll and resize is optional.
- The ticket does not name a popover testid. The implementer picks one and uses it in the acceptance tests. Prefer `build-order-annotation-popover`, following the `build-order-*` naming.
- The manager typed this ticket Chore although the behavior is visible. The Context section already says so. Nothing to fix.
