# SGS-140 ticket report 1

File: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-140-editor-compact-mode.md`

Title: Add a compact text-editor mode below 48rem of editor width. Component aoe4-build-order, Task, risk low, priority medium, about 40 lines of CSS. Depends on SGS-128. Covers M9.8, design C14, owner decision 2A. On merge: none. Lint passes.

Criteria: 390x844 textarea at least half the editor width; 1280x800 textarea fits 48 characters in its computed font; no compact mode at 48rem or wider; finish time hidden in the gutter only (the step table and table view keep it); row alignment in compact mode; active-step and stale tone unchanged; existing tests keep their values (textContent reads still work with display none); docs fix; gates and build.

Diagram: none (single component, no control loop).

Open questions: none.

Notes:
- The finish-time hide must be scoped to the gutter annotations. `StepTimes` is shared with the step table cell, and `step-finished` lives in `step-annotation.module.css` territory.
- The `.annotations li > span` font size is fixed at 0.8rem today. The ticket says it must follow the compact font rule.
- Risk: my rough estimate puts the 1280x800 bound (48 characters at 0.875rem, about 400 px) close to the available textarea width (column about 562 px minus gutter, annotations and padding). The ticket lets the implementer narrow the gutter min-width and annotation padding in compact mode if the C14 values alone fall short, and report the measured widths.
- Overlap with other tickets: none found. SGS-128 gates the new spec through its jscpd changes. Outline N (Tab-order spec) is the only other consumer of this area, and this ticket does not conflict with it.
- No graph rows added.
