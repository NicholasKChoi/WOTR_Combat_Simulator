# SGS-140 spec gate 3 (re-spec 2)

**Verdict: READY**

Read after `git fetch origin`: ticket, design/M9.md C14 and the M9.8 row, review-1, spec-gate-2, ticket-3 report, and the branch diff (`origin/main...sgs-140-editor-compact-mode`: `workbench.module.css`, `step-annotation.tsx`/`.module.css`, `build-text-editor.tsx`, `docs/aoe4-build-order.md`, new spec). `styles/global.css:8` confirms `html { font-size: 18px }`.

## Review-1 gap: closed

- 18px basis: Context now states 1rem = 18px and 48rem = 864px, which matches the code.
- Levers: Scope lists exactly what the branch does inside the compact `@container` only: `.annotations` 4.7ch with padding-right 0, `.gutter` min-width 0 with padding-right 0.125rem, `.textarea` horizontal padding 0.25rem. Diff matches line for line. Nothing outside the container query changed.
- Each other Scope item matches the branch: `container: build-editor / inline-size` on `.editor`; `--editor-font-size` default 1rem and 0.875rem in compact on the three elements; span `calc(0.8 * var(--editor-font-size))`; `.gutterEndTime` class applied only when `labelled` is false; `data-testid="build-order-editor"` added; docs paragraph updated.
- Criteria are unchanged and observable. Criterion 2 compares live measurements (textarea content vs a 48-char probe in its computed font), so no stale number is pinned. The 375/454/1.3 px figures appear only in Scope prose as context, not in a criterion.
- Known limits (3-digit gutter, `100:00`, thin margin) are stated as out of scope with a rule for headroom, so the implementer has nothing to guess.

Other checks: Risk low (CSS and a test id; no strongModelTrigger or criticalPaths hit), Invariants none, On merge `none`, Open questions none, Unverified assumptions none (real Chromium), no input validation, about 40 LOC, no overlap with SGS-132/133/134 beyond merge conflicts.

## Notes (non-blocking)

- Design C14 (and the M9.8 text) still assumes 16px and lists only the font, 8ch and finish-time rules. The ticket now diverges from it on purpose (padding trims, 4.7ch, which is within "at most 8ch"). The manager or designer should add an 18px note and the compact padding levers to C14 so a later reader does not treat the ticket as the deviation. The ticket records this and the owner check of other M9 rem bounds.
- The levers are "ratified" by the ticket agent in response to review, not by a recorded owner answer. They are CSS values of the kind the ticket itself permitted, and the reviewer offered ratify as the resolution, so I do not treat this as an `owner` gap. If the owner wants a different trade-off, the ticket's own headroom note says it is a separate ticket.
- Criterion 2's margin (about 1.3 px) depends on gutter digit count, the monospace fallback and Build column width. The test reads metrics live and fails loudly; the ticket documents the limit.
- Criterion 10 screenshots at 360/768/1280 were not taken by the reviewer; they stay with the visual gate.
- The container name `build-editor` is shared across two CSS modules; a rename in one file silently stops hiding the finish time (the compact test would catch it).
