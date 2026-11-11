# SGS-135 ticket report (1)

File: `tickets/SGS-135-chart-header-drag-handle-and-caret.md` (lint clean).

Summary: "Replace the chart Collapse, Up and Down text buttons with a drag handle and a caret". Component aoe4-build-order, M9.4, risk standard, about 160 business-logic lines (about 300 in the full diff). Depends on SGS-134 (uses `CollapseCaret`, `moveTo`, `chartLayout` prop, key-results collapse; none redefined). Covers: `chart-drag.ts` and `dropIndexAt`; `use-chart-drag.ts` (4px threshold, Escape/pointercancel cancel); `chart-header.tsx` (`ChartHeader`, `ChartControls`, `chartHandleKey` moved out of `line-chart.tsx`); headerControls slot moved into the header so it shows while collapsed; `chart-reorder-help` and `chart-order-status`; `focusAfterMove` effect replacing `pendingFocus`; removal of `chart-move-up/down`; docs paragraph "Chart controls"; Vitest (`chart-header.test.ts`, `chart-drag.test.ts`, `line-chart.test.ts` split) and rewrite of `acceptance/aoe4-chart-layout.spec.ts` (drag to order 2,3,1,4, keyboard reorder with focus kept, caret, persistence).

Diagrams: none (single-component; no diagram required).

Open questions: none. Plan design questions 5 and 6 are settled by the design (C3 focus mechanism; this ticket moves the headerControls slot).

Overlap: none with SGS-134 (it keeps `CollapseCaret` use on charts, `line-chart.tsx`, drag and the spec rewrite out of scope; this ticket owns them). Later tickets K, L, J edit `line-chart.tsx` and `results.tsx` after this one.

Notes: the SeriesChart prop that carries `sectionRef` is not named in the design; the ticket leaves the name to the implementer. The `dropIndexAt` midpoint-equal case is pinned by the implementer. No graph rows added. No commands run beyond `git grep` on `origin/main` (confirms `chart-move-` matches exist today in the spec, `line-chart.test.ts`, `line-chart.tsx`, `results.tsx`) and the lint.
