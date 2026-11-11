# SGS-126 ticket report 2 (re-spec)

File: tickets/SGS-126-pin-compare-pinned-only-legend-fixture.md

Scope now says: after `openPage` (default build loaded at the default 1200 s), assert `build-order-text` equals `DEFAULT_PASTE`, call `pin` directly with no `runOk`, then `runOk({ text: NO_MILITARY_PASTE })` as the current run. Added a `(respec 1)` acceptance criterion: no `runOk` call leaves both text and duration unchanged. Appended `## Re-spec 1 - 2026-11-10`. Lint passes. No diagram, no open questions, no overlap with other tickets.
