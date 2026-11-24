# SGS-217 ticket report (1)

Ticket: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-217-population-cap-spec.md`

Title: Add a Playwright spec for the Population chart and its cap mark. Type Chore (test-only, no visible change; it covers M13.2 and M13.3), Milestone M13, component aoe4-build-order, Risk low (confirmed: one new `acceptance/` file, no production code, no public surface, no INVARIANTS path match). Depends on SGS-216 (names taken from its ticket file). Branch `sgs-217-population-cap-spec`. LOC: 0 business logic, about 150 spec lines.

New file: `acceptance/aoe4-population-cap.spec.ts`, exemplar `aoe4-chart-views.spec.ts` plus zoom helpers from `aoe4-chart-zoom.spec.ts`.

Cases: (1) default 1200 s run has one `chart-time-mark` on `chart-population`, `data-at` equal to the API value (non-null asserted first), label `Population cap m:ss`, none on the other charts; (2) no cap Markers entry; (3) 600 s run has no mark; (4) 1200/1280/1800 px label inside the plot, no horizontal overflow; (5) mark survives hiding all kinds and hovering an entry; (6) pinned run: current run without cap draws no mark while the `pop-cap` row shows the pinned time (D9); (7) zoom: not drawn outside the window and back on reset, window-relative x and label side inside it (fails if origin is ignored), pointer-down on the label starts a selection (D16 to D18).

Diagrams: none (no-diagram sentence).

Open questions: none.

Notes for the manager:
- Label side at 1200/1280/1800 px: SGS-216 only says the implementer records observed values. Ticket case 4 pins a property (label inside the plot) and pins a side only if SGS-216's report names one. The 18:15 literal is not hard-coded; the label is derived from the API value.
- No overlap with other tickets. Existing specs that assumed four charts are SGS-216's; this ticket edits none.
- Dependency note: SGS-217 has no TASK-GRAPH row yet (lint accepted the dependency on SGS-216, which has one).
- Lint: `ticket-lint.py --graph ... --spec` printed no errors or warnings. Self-check items 1-15 and 17: no existing test, doc or rule depends on the change (grep of `acceptance/` at origin/main finds no `chart-time-mark`/`chart-population`); items judged ok/n-a. No scratch checkout was made; no mutation criterion runs a command.
