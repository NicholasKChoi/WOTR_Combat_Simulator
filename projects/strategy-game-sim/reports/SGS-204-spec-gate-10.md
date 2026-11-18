# SGS-204 spec gate 10

Verdict: READY.

Read at `origin/main` (5662cb8); branch checkout was not needed (tip 1f5ebe0 per the prompt). No Depends-on. No scratch checkout made.

## Gap from gate 8: closed

The only gap in gate 8 (Chore type, owner) is closed. PROJECT.md Decisions line 58 records the Q138 ruling: a backlog item tagged `(standalone chore)` stays a Chore even when it adds small visible UI text, and spec-gate and review do not bounce it. The ticket's Context cites it. No Open question rests on the type.

## Checks

- **Grounded scope.** At base: `unitUpgradeDots`, `visibleUpgradeDots` in `result-series.ts`. In `line-chart.tsx`: `currentDots`/`pinnedDots`, both `ReferenceDot` blocks, `measureRef`, `LABEL_FONT_SIZE`. In `chart-markers.ts`: `estimateLabelWidth`, `placeMarkers`. `upgradeTargets` is in `english.json`. `upgradeTierName`, `tierTextSlots`, `placeTierText` and `upgrade-tier-text.tsx` are new or branch-only, and the ticket says so.
- **Testable criteria.** All are behavior rules. Layout comparisons are required in one `evaluate` under `expect.poll` or `toPass`. Criterion 1 loops over the data and adds an invented-id case. There are no match counts or closed lists. The criteria do not conflict with Scope.
- **Existing tests.** `git grep` at base finds no test or component that reads `reference-dot` layer text. The dot selectors in the specs match the circles' testids, and the new text uses different testids. The ticket states the rule and the `text.recharts-label` search result, so none of them sees the new text.
- **Open questions:** none. **Invariants:** A1 named; no contradiction. **Contracts:** no design doc (Milestone none); new names go to CONTEXT.md under On merge, which is a single item that lists all three functions.
- **Dependencies and size:** none; about 90 LOC. **Diagrams:** not needed. **Decisions:** consistent with PROJECT.md. **Risk:** `standard` is right: no `criticalPaths` symbol and no strong-model trigger. Item 16 does not apply.
- **Docs.** The "Upgrade dots" paragraph in `docs/aoe4-build-order-ui.md` (line 129 at base) and the `page-help.tsx` upgrade-dot paragraph (line 101) are both in Scope with a matching criterion. The help-modal spec phrases are preserved.
- **Input validation:** no trust boundary. **Throwaway work:** TASK-GRAPH shows no other open ticket touching the dots.
- **Unverified assumptions.** The recharts `ReferenceDot` `label` behavior is listed. The recharts hook source for placement is listed as conditional, and the implementer names the hooks in the report.

## Notes (non-blocking)

- The estimated text width over-estimates, so an edge flip may fire early. The right-edge criterion catches a wrong side but not an unneeded flip. Acceptable.
- The rework is the placement logic (`tierTextSlots`/`placeTierText` to pixel space), the doc stacking sentence, the pin test's single `evaluate`, and the new men-at-arms two-tier case. The Re-spec 2 and 3 notes in the ticket already list this.
