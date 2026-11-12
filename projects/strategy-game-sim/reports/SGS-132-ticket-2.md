# SGS-132 ticket 2 (re-spec 1)

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-132-save-panel-live-status.md

Summary: "Put the save controls on one row with a live Saved status", component aoe4-build-order, ~130
business-logic lines, depends on SGS-128, covers M9.3. The three spec-gate-1 gaps and its useful notes are
folded in. (1) The criterion no longer asks for an abort case: the page aborts only on unmount, which I
confirmed in `save-build.tsx` at origin/main (the unmount effect, and `send` returning null when the request
was aborted). The two failure paths left are a stubbed error reply and a `route.abort()` network error.
(2) The layout criterion is now two. A Vitest static-render case covers the no-save state: `save-row` is the
first child of `save-panel` and holds the buttons, then the empty status with its role and aria attributes. A
Playwright case covers the stateful parts: the DOM order with the link shown, and that the copy form, copy
hint, storage notice and error are shown and are not descendants of `save-row`. Scope's Tests section names
the same split. (3) "Same render" is replaced with a property: the status is non-empty exactly when the link
is visible. Scope now says the status is derived only from `saved`, `settled` and `saving`. From the notes:
`.saveStatus` resets the paragraph margin, a new check says the empty status adds no row height, and every
geometry check, including the 390px line check, reads its rects in one `page.evaluate` or under `expect.poll`.
Changed criteria are tagged `(respec 1)`. A `## Re-spec 1 - 2026-11-11` section is appended.

Diagrams: none (single component, outside the core control loop).

Open questions: none.

Overlap: none. The gate confirmed SGS-133 depends on this ticket and stays out of the save panel.

Lint: `ticket-lint.py` reports no errors.
