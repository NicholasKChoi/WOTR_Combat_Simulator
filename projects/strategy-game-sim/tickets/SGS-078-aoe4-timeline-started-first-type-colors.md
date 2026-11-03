# SGS-078: Step timeline reads left to right in time order and colour-codes rows by step type

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: none yet (owner request 2026-11-02, after the timeline readability review)
- **Priority**: medium
- **Risk**: low
  <!-- One component, a row-builder field, one catalog field, CSS and spec edits; no route, engine output or API
       change. Under ~100 lines of business logic. -->
- **Invariants**: none adjacent (S1 holds: styles stay inside `components/apps/aoe4-build-order/`; the catalog field
  is derived from the shipped data, no game number in code beyond the existing landmark class rule)
- **LOC estimate**: about 70 lines of business logic (`stepKind` in `step-timeline-rows.ts` about 25, catalog
  `landmarks` about 8 plus moving `LANDMARK_CLASS`, `step-timeline.tsx` about 20, `results.module.css` about 20); tests
  and docs excluded
- **Depends on**: none (main `ee7ecb9`). SGS-076 also edits `results.tsx`/`results.module.css`; whichever lands second
  rebases.
- **On merge**: none
- **Source**: owner in chat 2026-11-02: "started should move to the left most column so that it reads as a timeline.
  i also think that color coding the row by the 'type' of action would also help scanning for important events";
  timeline review findings (age-ups and research not visually distinct, long labels).

## Context

`StepTimeline` (`components/apps/aoe4-build-order/step-timeline.tsx`) shows columns Step | Started | Finished |
Waited | Blocked by. Reading down the Started column is the timeline, but it sits second, after a long label. Every row
looks the same except yellow `table-warning` for flagged or long-wait rows, so an age-up landmark, a research or a
military production does not stand out among 25–64 rows of villagers and farms.

## Scope

All paths are relative to the repo root and under `components/apps/aoe4-build-order/` unless stated.

**1. Column order.** New order: **Started | Finished | Step | Waited | Blocked by**. Header text is unchanged. Row
order is unchanged (step order). No column is added or removed, so the table keeps `min-width: 30rem` and the 390 px
rule (SGS-073) holds. Started and Finished cells get `white-space: nowrap` and tabular numerals
(`font-variant-numeric: tabular-nums`) so the times line up.

**2. Step type.** `TimelineRow` gains `kind: StepKind`, computed in `timelineRows` from the parsed step:

| kind | rule (first match wins) | label shown |
|------|-------------------------|-------------|
| `age-up` | `action: 'build'` of a landmark (its id is in `catalog.landmarks`, item 3) | Age up |
| `research` | `action: 'research'` | Research |
| `military` | `action: 'produce'` of any unit other than the villager | Military |
| `villager` | `action: 'produce'` of the villager | Villager |
| `building` | `action: 'build'` (not a landmark) | Building |
| `economy` | `action: 'move'`, `'rally'`, `'pause'` | Economy |
| `other` | the parsed step is missing (the label is `step N`) | none |

The row builder takes no age argument: a landmark from a later age than the current one still gets `age-up`, though the
engine would not advance (its `entry.age === state.age` check). This is accepted; do not add an age argument.

Use the same villager id the engine and catalog already use; do not hard-code a new string if one is exported.
`timelineRows` takes the catalog (or just `landmarks` and the villager id) as a new argument; `Results` already has
no catalog, so the page passes `catalog` to `Results` and `Results` passes what `StepTimeline` needs.

**3. Catalog `landmarks`.** Move `LANDMARK_CLASS` out of `lib/aoe4-build-order/simulate.ts` into a module both the
engine and `schema.ts` can import (e.g. `lib/aoe4-build-order/landmarks.ts`, exporting `LANDMARK_CLASS` and
`isLandmark(entry)`); the engine keeps its behavior. `BuildOrderCatalog` gains `landmarks: string[]`: the base ids of
building entries whose `classes` match `LANDMARK_CLASS`, sorted. For English this is exactly
`abbey-of-kings`, `berkshire-palace`, `council-hall`, `kings-palace`, `the-white-tower`, `wynguard-palace` (sorted);
the catalog unit test pins all six.

**4. Colours.** Each row gets `data-kind="<kind>"` and a CSS module class for its kind: a 4 px coloured left border on
the first cell plus a small text badge with the kind label at the start of the Step cell (so the type is not shown by
colour alone). Suggested palette, with Bootstrap 5 variables so it works on the site's light theme:
age-up `--bs-primary` (also bold Step text), research `--bs-info`, military `--bs-danger`, villager `--bs-success`,
building `--bs-secondary`, economy `--bs-gray-400`, other none. The existing yellow `table-warning` background for
flagged and long-wait rows stays and is independent of the kind colour (border and badge still show on a yellow row).
Add a legend listing the kinds and their colours as a `div` above the table (a table cannot hold it between caption and
thead), `data-testid="step-timeline-legend"`. It uses `flex-wrap: wrap` so six items fit at 390 px without horizontal
overflow. Its acceptance check is visibility, not two sequential `boundingBox` reads.

**5. Tests.**
- Unit (`step-timeline-rows.test.ts`): one case per kind, including a landmark build → `age-up`, a non-landmark build
  → `building`, villager vs military produce, each of move/rally/pause → `economy`, a missing parsed step → `other`.
  Catalog test: `landmarks` for English equals the confirmed list.
- Acceptance: `acceptance/aoe4-build-order.spec.ts:643` header assertion becomes
  `['Started', 'Finished', 'Step', 'Waited', 'Blocked by']`. Every spec that reads timeline cells by position
  (`acceptance/aoe4-build-order-timeline-compare.spec.ts` lines 46–57 and any other `step-timeline-row` … `td.nth(n)`
  found with `git grep -n "step-timeline" acceptance`) is repointed to the new positions (Started 0, Finished 1, Step
  2, Waited 3, Blocked by 4); the expected values do not change. Known edits: in
  `acceptance/aoe4-build-order-timeline-compare.spec.ts`, `td.nth(1)` and `td.nth(2)` at lines 47-48 become `nth(0)`
  and `nth(1)`; the `nth(4)` calls at lines 49 and 57 stay, and so does `nth(4)` at `aoe4-build-order.spec.ts:637`. The PR lists each edited line. Compare-panel rows
  (`compare-*`, lines 68–91) are a different table and do not change.
- New acceptance check (in the timeline-compare spec): for the knight + longbow prebuilt, the row for the
  `kings-palace` build step has `data-kind="age-up"`, a `research` row has `data-kind="research"`, and
  `step-timeline-legend` is visible.
- `acceptance/aoe4-narrow-layout.spec.ts` passes unchanged.

**6. Docs.** `docs/aoe4-build-order.md` "Page": the timeline column order and the step kinds and their colours.

**Out of scope:** the "Late" column, muting unfired reactions, age dividers, grouping repeated rows, filters, label
shortening (other review proposals; separate tickets); sorting rows by time; a dark theme; any engine or API change.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [x] The timeline header reads Started | Finished | Step | Waited | Blocked by, and cell values are unchanged.
- [x] Every row has a `data-kind` from the table above; unit tests cover each kind.
- [x] `catalog.landmarks` is derived from the data via the shared `LANDMARK_CLASS`; the engine's age-up behavior and tests are unchanged.
- [x] Each kind shows a coloured left border and a text badge; `table-warning` still applies to flagged and long-wait rows.
- [x] `step-timeline-legend` is a div above the table, lists the kinds, wraps, and is visible; the 390 px spec passes unchanged.
- [x] Catalog unit test: English `landmarks` equals the six ids above; a later-age landmark build maps to `age-up` in the row builder.
- [ ] Existing specs that read cells by position are repointed with unchanged expected values, listed in the PR; the full unit and acceptance suites pass, including the 390 px spec.
- [x] `docs/aoe4-build-order.md` describes the column order and kinds.
- [x] No INVARIANTS.md regressions

## Open questions

None. Defaults chosen: the six kinds and palette above, border plus badge (not full-row tint, which would clash with
the yellow warning rows). The owner can change these at spec gate.
