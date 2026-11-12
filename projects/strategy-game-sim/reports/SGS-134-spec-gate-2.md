# SGS-134 spec gate 2

Verdict: READY

Read at origin/main (after `git fetch origin`). SGS-128 has no local branch, so I used its ticket for the end state of `storage-test-helpers.ts`.

## Gap 1 from gate 1: closed

- Scope now says the write effect skips until `loaded` is true and skips while the layout is the object the mount effect read. It names this as a narrowing of design C2 ("no write on load"), and C2's "no write before the read" still holds.
- That rule keeps `acceptance/aoe4-chart-layout.spec.ts` line 55 ("loading writes nothing", `stored(page)` is null) passing unedited. Scope and criteria both say the spec is not edited.
- Under React strict mode the mount effect runs twice. The ref keeps the last object read, which is also the final state, so the guard still holds.
- The earlier notes are also done: viewport helpers named (`TABS_VIEWPORT`, `SPLIT_VIEWPORT`, `showTab` all exist in `acceptance/helpers.ts`), `data-collapsed` as the string "true" or "false", `mb-3` kept, and the `fakeStorage` call shape noted.

## New blocking gaps: none

- The named files exist, or are marked new. The acceptance specs live in the repo-root `acceptance/` directory, which the ticket names explicitly.
- `useChartLayout(` is called only in `results.tsx` at the base, so the search criterion holds after the change.
- The contracts (C2, C3 `CollapseCaret`, C4, C5) match the design text.
- The doc statements at `docs/aoe4-build-order.md` lines ~1000 and ~1007-1008 are named. `ARCHITECTURE.md` has no matches.
- Risk `standard`, invariants `none`, `On merge: none` and size ~180 LOC are fine.

## Notes (non-blocking)

- The `CollapseCaret` `aria-label` criterion says "a test covers both states", but the Scope Tests list has no caret test file. Say it is covered through `compare-panel.test.ts` markup (`Collapse key results` and `Expand key results`) or a new `collapse-caret.test.ts`. An implementer can resolve this either way.
- The `ComparePanel` markup criterion could also assert the caret `aria-label` for both states, which would settle the note above.
