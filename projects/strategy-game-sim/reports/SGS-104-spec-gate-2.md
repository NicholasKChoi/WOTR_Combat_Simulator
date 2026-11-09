# SGS-104 spec gate 2

**Verdict: READY**

Checked against origin/main 1e6d6c2. The local `main` ref is stale (ee7ecb9); I read everything through `origin/main`.

## Checks

1. Grounded scope: pass. These exist on origin/main:
   - `workbench-tabs.tsx` and `workbench.module.css`, which holds the single `@media (min-width: 1200px)` block with `.resultsSplit` and `.timelineColumn`.
   - `results.tsx`, which uses `resultsSplit`.
   - `acceptance/aoe4-results-split.spec.ts`.
   - `CHART_IDS`, exported from `acceptance/helpers.ts:86`, which also has `showTab` and `openPage`.
   - The `docs/aoe4-build-order.md` sentences the ticket names, at lines 847, 849, 852, 873 and 934.
   - `editor-view-*` and `step-table-unavailable`.
   - The Next doc path `04-automatic-static-optimization.md`.
   - `use-split-layout.ts` does not exist and is marked new.
   - The grep recount matches: 12 specs on main plus `helpers.ts`.
   - Names taken from SGS-102 (`waitForRun`, `expectNoRun`, `auto-run-status`, `results-last-good`) are in SGS-102's Scope and are described as "as SGS-102 ends".
2. Testable criteria: pass. Each criterion has an observable and a stated break it catches. The grep criteria hold in the end state. Viewports are inputs. No stale counts are pinned; the spec-count rule replaces a list. The existing-test rule is stated in Scope (rules 1-5).
3. Open questions: none. CONTEXT.md has none.
4. Invariants: S1 and A3 are named and the criteria do not contradict them.
5. Contracts: pass. `useSplitLayout`, `WORKBENCH_SPLIT_QUERY`, the `split` prop, `viewDisabled = !split && shownTab === 'results'` and the 1800 px move all match design/M6.md C6 and "Layout". The SGS-102 names agree with SGS-102's Scope.
6. Dependencies and size: depends on SGS-102; about 90 LOC of business logic.
7. Diagrams: none required, and no trigger fires.
8. Lessons: the repo lesson (read layout in one `page.evaluate` or under `expect.poll`) is applied. The project LESSONS.md is empty.
9. Decisions: CONTEXT.md Decisions is "None". The body agrees with the design, and no answered question remains open.
10. On merge: none. This adds no command, harness or design doc, and writes no Decisions rule into a repo doc.
11. Risk: standard is right. No `strongModelTriggers` item applies (UI layout, a new contract the design specifies exactly, no critical-path symbol, under 250 LOC). `docs/api/openapi.json` is correctly left alone.
12. Docs: `docs/aoe4-build-order.md` is in Scope with the sentences to rewrite. I found no other stale layout text in README, ARCHITECTURE.md, components or pages. The only other `1200 px` match is the CSS being changed.
13. Input validation: no trust-boundary input is added.

## Notes (non-blocking)

- Rule 4 of "Existing specs" mentions only boxes inside the results column. At 1280 px the Build column is also half width, so assertions about the editor, issues or step table at 1280 px can fail the same way. Affected: the 1280 `setViewportSize` calls in `aoe4-build-order-inline-issues.spec.ts` and `aoe4-step-table.spec.ts`, and the WIDE constants in `aoe4-build-order-step-band.spec.ts` and `aoe4-chart-readability.spec.ts`. Suggested rewording: "a box inside either column". The remedy (move to 1800 px, expected value unchanged, report it) already covers them, so an implementer would get there without guessing.
- The "resize keeps focus and state" case needs the textarea (text view) and the step-table draft row (table view), and only one editor view is mounted at a time. The implementer should split it into two tests, or run the round trip twice, once per view.
- The criterion that `matchMedia` appears only in `use-split-layout.ts` forbids a colocated unit test that stubs `window.matchMedia` under `components`. No such test is required, so this is fine as is.
- The Next docs path is in Scope, as AGENTS.md requires.
