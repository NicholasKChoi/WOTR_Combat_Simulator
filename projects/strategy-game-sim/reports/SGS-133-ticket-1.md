# SGS-133 ticket author report 1

File: projects/strategy-game-sim/tickets/SGS-133-split-scroll-anchoring-and-run-bar-cap.md (lint clean)

Summary: "Stop scroll anchoring in the split layout and cap the run bar height". Component aoe4-build-order, Task, risk standard, about 15 business-logic lines (CSS in `workbench.module.css`), depends on SGS-132 (SGS-128 transitively). Adds `overflow-anchor: none` (placement left to the implementer, per design) and `.runBar { max-height: 40dvh; overflow-y: auto }` from 768px up; `useRunBarHeight` unchanged. Extends `acceptance/aoe4-split-scroll.spec.ts` with design cases (a) scrollY stable on error clear, (b) cap and `--aoe4-run-bar-height` agreement, (c) a control below the cap is reachable; plus a below-768px static/uncapped check. Docs: the "Page" paragraph's run-bar-stays-at-top statement and the narrow-layout "run bar scrolls with the page" sentence.

SGS-132 interaction: `auto-run-status` stays after the save panel; under the cap it is reached by scrolling the bar, keeps its test id, and children are not reordered. Spec reuses SGS-132's acceptance helpers (no clones, jscpd gate).

Diagrams: none (single component).
Open questions: none (design question 10 answered: the property is the capped height plus margin; reachability asserted).
Overlap: none. No graph rows added. Criteria with commands were not run against code (none are grep-style; mutation checks are for the implementer).
