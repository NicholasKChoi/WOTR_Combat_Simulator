# SGS-204 spec gate 8

Verdict: NEEDS_SPEC (one owner gap: the ticket type). Everything else in the re-spec 2 ticket checks out.

Read at `origin/main` (0866156) and the task checkout `worktrees/sgs-204-upgrade-dot-tier-indicator` (tip 1f5ebe0). No Depends-on. No scratch checkout made.

## Gaps

1. **Type / Context - `owner`** - The ticket is typed Chore, milestone `none`, and its whole purpose is new visible text beside every upgrade dot. The template defines Chore as "no behavior the owner sees changes", and review (`agents/review.md`, Chore) makes a visible change a `contract` finding and, when it cannot be avoided, NEEDS_SPEC "it is not a Chore". Review 6 raised this as spec gap 1 and said who can close it: re-type as Feature, or the owner records that this Chore may change visible behavior. Re-spec 2 answered only with the sentence "the type stays Chore because the owner tagged this a standalone chore", which records the tag, not a ruling that a Chore may change what the owner sees. Nothing in PROJECT.md Decisions or BACKLOG.md carries one (grep for chore/tier/dot found only an unrelated chore row). Review will return the same finding on the next pass. An implementer cannot resolve this: it decides who runs acceptance-test and which pipeline the ticket takes.
   - Proposed fix (owner picks one):
     - (a) Record in PROJECT.md Decisions that standalone ticket SGS-204 stays a Chore although it adds visible tier text, and the ticket's Context cites that decision. Review's Chore check then has an owner answer to rest on.
     - (b) Re-type as Feature. The template says a Feature is never `none`, so it must be planned into a milestone (or the owner confirms a milestone that covers it). Acceptance-test then owns and runs the spec cases.
   - Everything else in the ticket is unaffected by either choice.

## Checks that passed

- **Grounded scope.** At the base: `unitUpgradeDots`, `visibleUpgradeDots`, `UpgradeDot` in `result-series.ts`; `ReferenceDot` blocks, `measureRef`, `LABEL_FONT_SIZE` in `line-chart.tsx`; `chart-markers.ts` `placeMarkers`/`estimateLabelWidth`. New files and functions (`upgradeTierName`, `tierTextSlots`, `placeTierText`, `upgrade-tier-text.tsx`) exist only on the branch and the ticket names them as the branch's. Doc paragraph and help paragraph confirmed in gate 4 and unchanged on main.
- **Tier rule (re-spec 1, still holds).** Segment count against the dot's key gives `Veteran`/`Elite`/`Early` and `Upgrade` for `men-at-arms`; criterion 1 loops over the data and adds the named men-at-arms cases.
- **Placement rule.** Re-spec 2 states it as behavior in pixel space (any two texts whose boxes would intersect, own-dot clearance, right/top/bottom edges) with the pixel source left to the implementer; criterion 2 has a unit case for two dots a few pixels apart that fails on `at:value` grouping. No guessed numbers or quoted names beyond branch-function names that the ticket labels as the branch's.
- **Acceptance criteria.** Every layout comparison is stated as one `evaluate` under `expect.poll`/`toPass` (LESSONS.md); criterion 4 requires an intersection check, not a not-identical check, and its precondition (two MAA tiers) is built from build text. No match counts or closed lists. Existing-test impact is covered by a rule (no `recharts-label` class, dot selectors match circles), and gate 4's search of the `text.recharts-label` and layer-text selectors still applies; no new test depends on the change.
- **Open questions:** none. **Invariants:** A1 named, no contradiction. **Contracts:** no design doc (Milestone none); new names go to CONTEXT.md via On merge, which is `; `-free single item and lists all three functions. **Dependencies and size:** none; about 90 LOC. **Diagrams:** none needed. **Risk:** `standard` is right: no `criticalPaths` symbol or strongModelTriggers item. Hotspot check (item 16) does not apply. **Docs:** both made-untrue docs are in Scope with a matching criterion, including the "at one point stack" sentence. **Input validation:** no trust boundary. **Throwaway work:** no other open ticket touches the dots (203, 206 do not).
- **Unverified assumption** (recharts `ReferenceDot` `label` content renders inside the dot layer with the dot's box as viewBox, no `recharts-label`, no portal) was read in recharts 3.10.1 source in gate 4 and is listed.

## Notes (non-blocking)

- Cross-label placement: a `label` content element sees only its own dot's viewBox, so grouping needs a shared pass with pixel positions from somewhere else (plot box and domains in `SeriesChart`, or recharts' plot or scale hooks). If the implementer uses recharts hooks, that is a second recharts behavior only a Chromium run exercises and belongs in `Unverified assumptions`; the ticket leaves the source open.
- Criterion 9 (no hard-coded tier word or unit name) is met by the data loop only for the 11 current ids. Cheap strengthening from gate 4 still stands: one unit case with an invented id and key (for example `mighty-widgets` with `widget` gives `Mighty`).
- Estimated text width (8 px per char) over-estimates, so edge flips may fire early; the right-edge acceptance criterion catches a wrong side, not an unneeded flip. Acceptable.
