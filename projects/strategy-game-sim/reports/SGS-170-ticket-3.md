# SGS-170 ticket 3 (re-spec 2)

File: tickets/SGS-170-step-annotation-hover-popover.md. Lint clean.

- Docs: Scope and criterion now point at `docs/aoe4-build-order-ui.md` (verified at origin/main, line 19); the last-wins sentence must stay consistent. No other doc mentions the gutter title.
- Hover/caret: Scope states the popover follows the single `activeStep`, last event wins, pointer leave sets null and the caret line is not restored. New criterion (respec 2) pins the caret-on-A, hover-B, leave-B sequence.
- Notes folded in: popover via portal to document.body (container-type: inline-size, li.textContent).
- Appended Re-spec 2. Size, risk, dependencies unchanged. No open questions; no diagram; no overlaps.
