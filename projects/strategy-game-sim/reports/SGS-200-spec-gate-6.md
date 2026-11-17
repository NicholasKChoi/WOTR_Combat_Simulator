# SGS-200 spec gate, round 6

Verdict: READY

Read at origin/main 683991c (after `git fetch --no-auto-maintenance origin`). SGS-190, 191, 192 and 197 are integrated. SGS-193, 198 and 199 are not, so their text was checked against their tickets only; Depends-on keeps SGS-200 from starting before they merge.

## Round-5 gap: closed

Re-spec 4 now says the marker-control paragraph already exists at origin/main and should be completed against B-M1 to B-M10. Checked:
- `docs/aoe4-build-order-ui.md` Results paragraph describes "One marker control titled 'Markers', above the charts and shared by all of them", with `aria-pressed`, the hidden kinds not stored and reset on reload, and "A run with no markers draws neither lines nor the marker control".
- `git grep -i "marker legend" origin/main -- docs/` matches nothing, so the criterion's "matches nothing at origin/main; kept to catch later wording" is true.
- The Chart controls paragraph still says "title row" and "everything under the title row (the series legend and the plot)". The Scope bullet and criterion 6 (re-read it against the table) cover that.
- The lib README bullet now says to check `wait-detail.ts` (already listed, line 62) and add only `unit-lines.ts` and `instanceFree`. At origin/main README has no `unit-lines` and no `instanceFree`; `instanceFree` exists in `engine-common.ts:73`.

## Checks

1. Grounded: `wait-detail.ts`, `unit-lines.ts`, `chart-markers.ts`, `chart-zoom.ts`, `use-chart-zoom.ts` and `MarkerControl` (chart-legend.tsx:70) and `waitDetailText` (wait-detail.ts:116) exist. `unitLineSeries` and `unitUpgradeDots` do not yet exist (SGS-198, a Depends-on, is unmerged); the ticket reads at the integrated end state, so this is fine.
2. Criteria are observable: stale-phrase searches over docs only (no code search), rule-number maps, no pinned counts. At origin/main the searches match as the ticket says: `tier <tier>` (ui:114), `step-kind-legend` (ui:99), `in that order` (ui:103), `was still waiting on resources` (format:433), "kind legend renders above" (ui:20 matches the text-view wording).
3. Open questions: none.
4. Invariants: A3 adjacent, docs only.
5. Contracts: names match the code and design.
6. Dependencies and size: stated, no code, standalone check not applicable.
7. Diagrams: none required.
8. Decisions: Q128 (help modal lands last, not touched) respected.
9. On merge: a single `; `-separated list.
10. Risk: low is right (docs only, no `criticalPaths` symbol touched).
11. Docs: all affected docs are in Scope, including ARCHITECTURE.md (header sentence unchanged) and the lib README.
12. Input validation: not applicable.
13. Correct as written: quoted phrases match the base. The ARCHITECTURE rule for `wait-detail.ts` (browser-safe) fits its imports (`engine-common`, `landmarks`, `model`; type-only `simulate`).
14. Throwaway work: none; the ticket checks, not rewrites, what SGS-193 and SGS-198 own.
15. Unverified assumptions: none is right for docs.
16. Not applicable (low risk).

## Notes (non-blocking)

- The Marker control bullet's examples "(B-M5 fallback, B-M8 lifetime, B-M10 keyboard)" are partly already in the doc (the hidden-kind fallback to age-up labels and the not-stored lifetime are stated). The implementer should treat them as things to verify, and add only what is missing (for example the Tab order and no arrow-key handling, B-M10).
- Re-spec 1 says "title row is kept for the chart header" while Scope and criterion 6 say to re-read it against the table; the implementer should follow Scope (collapse hides the body row) and keep the sentence only where the code still has a title row.
