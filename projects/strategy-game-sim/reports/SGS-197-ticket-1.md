# SGS-197 ticket report 1

File: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-197-drag-select-zoom-pan-reset-on-every-chart.md`
Lint: `ticket-lint.py` printed no errors.

Summary: "Add drag-select zoom, pan and reset to every results chart", Feature, M11, component aoe4-build-order, risk standard, about 250 lines (`use-chart-zoom.ts` about 150, `line-chart.tsx` about 80, plus the small moves of `DRAG_THRESHOLD_PX` and CSS). Depends on SGS-195 and SGS-196 (SGS-194 transitively). Criteria cover B-Z1 to B-Z15 with the cancel, no-leftover-listener, survives-new-run (clamp to null stays unzoomed), no-storage, tab-order and unzoomed-unchanged cases, plus the single `DRAG_THRESHOLD_PX`. Q129 is folded in: while zoomed the y axis counts the `rowsInWindow` edge rows, and a criterion requires the new acceptance spec `acceptance/aoe4-chart-zoom.spec.ts` to pick a chart and window where an edge-row value outside the window is the highest (asserted from the API first) and to check the axis top reaches it.

Diagrams: a Mermaid state diagram of the pointer interaction (idle, armed, dragging); no component flowchart (single component).

Open questions: none. On merge: none. Unverified assumptions list three recharts and pointer-capture behaviors the acceptance spec exercises for real.

Docs: no doc mentions zoom, so none is made untrue; the M11 docs ticket (K) owns the zoom description and the ARCHITECTURE.md entry. Searched `docs/` for zoom, time window and drag-select.

Existing tests: searched acceptance for pointer presses inside plots. `aoe4-chart-readability`, `aoe4-chart-views` and pin-compare only hover through `plotPoint`; `aoe4-chart-layout` presses only drag handles. None expected to move; the ticket requires them unchanged.

Overlap with other tickets: `line-chart.tsx` is also edited by SGS-195 (before) and the units ticket H (after); the ticket reads SGS-195's end state and leaves `upgradeDots`/`pinnedUpgradeDots` to H. No code this ticket changes is deleted by another ticket. Source files were read at `origin/main` (SGS-194, 195 and 196 not integrated); no scratch checkout made and none needed. No criterion names a runnable search or mutation command.

Note for the manager: the outline sizes this at L (about 250); with UI excluded from `strongModelTriggers` it is risk standard as the plan says.
