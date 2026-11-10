# M7 designer pass 3 (owner answers DQ1 to DQ7)

File: `design/M7.md`. Only what the answers decide was added; the approved contracts are unchanged.

## M7.8 house rule (DQ1, A)
- Rule (Behavior rules, "Auto-houses (M7.8)"): with `autoHouses` on, auto-houses plan from the start; explicit `build house` steps add on top; ordering, conflict, repeat, `autoHouses: false`, no-target, cancel/failure rows written.
- Contracts removed: `SimWarning` variants `auto-houses-never-start` and `auto-houses-held`; `houseGateOpen`, `lastHouseStep`, `accrueHeld`, `houseWarnings`, engine `heldAt`/`heldSeconds`; the `depletion.ts` ordering branch; OpenAPI variants and `warnings` description. No code added.
- Docs to change: `docs/aoe4-build-order.md` (Houses and supply, sort sentence ~430, Severity ~443, `warnings` field ~793-808), `docs/api/openapi.json` (~3631, ~4099, ~4137), `data/aoe4-build-order/README.md` (~115).
- Test: reduced fixture (early house plus late house behind `at(600)`); first assert the old rule would hold production, then villager production continues and no `auto-houses-*` warning. Acceptance API spec and contract spec updated.
- Build 259 file: `english-1tc-council-hall.json` in the worktree has 27 steps and zero `build house` steps, so it is the "no house steps" variant, not the case that froze (the 4-house text is not in the repo). Recommendation recorded in the design: do not add it; it would also change `listBuilds()` (uncommitted `builds.ts` import).
- Prebuilt builds that shift: `english-1tc` (2 house steps), `english-knight-longbow` (5). `english-spear-longbow-maa-crossbow` has none and is unaffected. Ticket reruns their specs, updates pinned numbers, retunes data only if a bar breaks, and rewrites the README sentence.

## Build panel scroll (DQ2, A)
Rule: table fits its column with wrapping cells; panel-wide `overflow-x` on `.workbenchSplit > :first-child` removed; `step-table-scroll` box is fallback only; narrow screens out of scope. Check: at 1280 px, one `page.evaluate`, table `scrollWidth <= clientWidth`, textarea right edge inside the column, panel `scrollWidth <= clientWidth` (in `aoe4-step-annotations.spec.ts`).

## DQ3 to DQ7
Legend also above the Text editor (one at a time); gutter `li` uses `step-started`/`step-finished`; last event wins between caret and gutter pointer; `results-split` wrapper and test id removed; `aria-describedby` only while dimmed and status text non-empty.

## Changed sections
Summary, Starting state (3 rows), Modules (`simulate.ts`), Contracts (removed and changed lists, DOM table), Criteria map (M7.8 and scroll rows, M7.7 docs), Layouts (build 259 note), Behavior rules (Legend, Results, gutter, scroll, Auto-houses), Owner decisions (item 3).

Planner impact: outline E is unblocked (no DQ1 wait); B takes the scroll rule and `aria-describedby`; C removes `results-split`; D takes legend, test ids, last-event-wins.
