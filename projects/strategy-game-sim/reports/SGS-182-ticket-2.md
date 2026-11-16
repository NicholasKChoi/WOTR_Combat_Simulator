# SGS-182 ticket report 2 (re-spec 1)

File: projects/strategy-game-sim/tickets/SGS-182-save-load-auto-run-specs-to-desktop-viewports.md

- Scope sentence and acceptance criterion 1 are restated as behavior plus a diff read. Edited cases run at 1200 px or wider and never click or assert a tab control. The diff removes showTab, TABS_VIEWPORT, PHONE and NARROW uses. Review reads the diff. tsc proves only that no import is missing.
- The scroll case names `build-column` (not `panel-build`), and the criterion asserts only `> 0` with no pinned value (the 245 is not mentioned).
- Criteria 1 and the scroll criterion are tagged (respec 1). A Re-spec 1 section is appended. Everything else stands.
- ticket-lint passes with no errors. No diagrams needed. No open questions. No overlap with other tickets.
