# SGS-104 ticket 2 (re-spec)

File: projects/strategy-game-sim/tickets/SGS-104-split-layout.md

Folded the four spec-gate findings into Scope and Acceptance criteria, plus the non-blocking 1200 boundary note.
1. Tree rule: one stable wrapper, tablist conditional as first child, panels at fixed positions; criterion now asserts focus on the editor textarea, step-table draft and pin surviving TABS -> SPLIT -> TABS.
2. "split at 1280": rect bounds inside the viewport for editor textarea and results-last-good.
3. CHART_IDS: already exported from acceptance/helpers.ts on origin/main (line 86) and imported by other specs, so the finding's premise was wrong; Scope says the new spec imports it.
4. Rule 4: spec moves to the 1800 px WIDE viewport, listed as a finding.
Also: boundary criterion polls and checks scrollWidth at 1200.
Diagrams: none required. Open questions: none. No overlap found.
