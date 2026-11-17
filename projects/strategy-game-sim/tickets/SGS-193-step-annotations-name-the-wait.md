# SGS-193: Step annotations name the wait (`a free Archery Range 0:23`)

- **Type**: Feature
- **Component**: aoe4-build-order
- **Milestone**: M11
- **Priority**: medium
- **Risk**: standard
- **Invariants**: A2 (the wait the page shows is the engine's reported wait: the text is built only from `waitDetails`, `waitingFor` and `waitingOn` of the result, never recomputed in the page)
- **Unverified assumptions**: none
- **LOC estimate**: 50 (business logic: `stepRun`, `blockedByText` and the `StepRun` type in `step-annotations.ts`; the rest is tests)
- **Depends on**: SGS-192
- **On merge**: none
- **Source**: design/M11.md M11.5b annotation half (B-W10, C17); plans/M11-20261116.md outline E

## Context

The run cell's `step-blocked-by` and the gutter popover's `Blocked by:` part print generic text (`resources 0:30`, `still waiting on prerequisite`) built from `waitBreakdown` and `waitingOn` in `stepRun` and `blockedByText` (`components/apps/aoe4-build-order/step-annotations.ts`). SGS-192 adds `StepTiming.waitingFor` and `waitDetails` and `waitDetailText` (`lib/aoe4-build-order/wait-detail.ts`, browser-safe); this ticket makes the page print them, so a step reads what it waited for (`50 gold 0:30`, `a free Archery Range 0:23`, `still waiting for Castle Age`). The run cell and the popover both read `StepRun.blockedBy`, so both change through it.

## Scope

All paths in `components/apps/aoe4-build-order/` unless noted. Read SGS-192's end state of `StepTiming` (`waitingFor: StepWaitDetail | null`, `waitDetails: StepWaitEntry[]`) and `waitDetailText`; the page code does not re-derive any wording.

- `step-annotations.ts` (design C17): `StepRun` drops `waitBreakdown` and gains `waits: { text: string; seconds: number }[]` (built from `timing.waitDetails`: only entries with `seconds > 0`, in list order, `text = waitDetailText(detail)`) and `waitingForText: string | null` (`waitDetailText(timing.waitingFor)`, or null when `waitingFor` is null). `formatWaitBreakdown` and the `BREAKDOWN_ORDER` constant it served are deleted. `blockedByText` follows B-W10:

| status | `blockedBy` |
|--------|-------------|
| `not-reached` | `not reached (<waitingOn>)`, unchanged |
| `completed`, `in-progress` | `<text> <m:ss>` per `waits` entry (`formatMinSec` of the seconds), joined with `, `; empty when there are none |
| `waiting`, `waitingForText` set | the entries as above, then `still waiting for <waitingForText>`, joined with `, `; alone when there is no entry |
| `waiting`, `waitingForText` null | the entries, then `still waiting on <waitingOn>` (today's fallback), joined with `, `; alone when there is no entry |

- Decided (owner, respec 2): the table is final. A `waiting` step prints all its entries, then the tail, so a step whose own wait is the thing it still waits for reads `Castle Age 20:00, still waiting for Castle Age`; nothing is omitted by `waitTargetKey`. Any doc or design wording saying the Castle Age or Barracks cell is exactly `still waiting for ...` is wrong and is not copied into tests or docs.
- Unchanged: `annotationDetailText` (form and `Blocked by: nothing` for an empty `blockedBy`), `waitedText`, `longWait` and `flagged`, stale dimming and alignment, `step-annotation.tsx` (it renders `run.blockedBy` only; it needs no edit unless `tsc` demands one).
- Existing tests that depend on the changed text or type take the new expected value; a rule, not a closed list. Examples the search found: `step-annotations.test.ts` (the `formatWaitBreakdown` rows go; the `StepRun` table `%s waiting on %s reads ...` and the `annotationDetailText` table are re-expressed with `waitDetails` and `waitingFor` fixtures; its `timing()` fixture takes SGS-192's fields); `step-annotation.test.ts` (its `run()` fixture has `waitBreakdown: []`, which becomes `waits: []` and `waitingForText: null`). `acceptance/aoe4-step-annotations.spec.ts` asserts the `step-blocked-by` text only for `not reached (...)`, an empty value and the popover forms for a completed no-wait step and a not-reached step, so those assertions keep their values; any acceptance spec that asserts the old generic reason text is rewritten to the new forms. The implementer lists every test it edits.
- Tests (`step-annotations.test.ts`): B-W10 rows for each row of the table above; entries with 0 s are omitted; list order is kept (not the old reason order); a `waiting` step with entries gets the `still waiting for` tail after them; the same `StepTiming` with `waitingFor: null` falls back to `still waiting on <waitingOn>`; `waits` text is exactly what `waitDetailText` returns for the entry's detail (use a detail whose text differs from the old reason name, so a test fails if the old reason names are still printed).
- Acceptance (`acceptance/aoe4-step-annotations.spec.ts`), three cases, each asserting the API result first and then the page text from the Table and Text views as the design lists. Every expected text is built from the API facts the spec read (the step's `status`, `waitingFor`, the `waitDetails` entries with `seconds > 0`, each entry's names and seconds, with times through `formatMinSec`), never from a time or a list of entries the spec assumes; the spec may import `waitDetailText` from `lib/aoe4-build-order/wait-detail.ts` to word a detail, as it already imports `formatMinSec` (respec 1):
  - paste `start 6 sheep -> sheep` and `produce knight from stable x1`: the spec asserts from the API that the knight step is `waiting` with an `age` `waitingFor` whose text is `Castle Age`; the row's `step-blocked-by` equals the full text built from the API facts: each `waitDetails` entry with `seconds > 0` in order as `<text> <m:ss>`, then `still waiting for Castle Age`, joined with `, ` (the step's own `age` entry is printed, e.g. `Castle Age 20:00, still waiting for Castle Age`; no entry is dropped because it names the same target as `waitingFor`). The gutter popover holds the same text as the cell. (respec 2)
  - paste `produce man-at-arms from barracks x1`: the same, with a `building` `waitingFor` for the barracks; the full text is the entries then `still waiting for a Barracks` (e.g. `a Barracks 20:00, still waiting for a Barracks`). (respec 2)
  - paste `produce scout from capital-town-center x1` then `produce villager from capital-town-center`: the spec first asserts from the API that step 2 waited under `prerequisite` and that its `waitDetails` hold exactly one entry with `seconds > 0`, a `building-busy` entry; then it asserts step 2's `step-blocked-by` equals `<text> <m:ss>` for that entry, where `<text>` is the `building-busy` form of the C6 table (`a free <name>` with a leading `The ` dropped from the snapshot name) and `<m:ss>` is `formatMinSec` of the entry's seconds (design sample: 0:23). A step 2 with a second non-zero entry fails the API assertion, not the text assertion. (respec 1)
- Docs (respec 1): `docs/aoe4-build-order-ui.md`, the run-cell paragraph (the sentences after "The cell labels the three times Started, Finished and Waited"). Two statements become untrue: that a step lists each cause with a non-zero time as `<cause> <m:ss>` "in that order" (resources, villagers, population, prerequisite), and that a `waiting` step adds `still waiting on <cause>`. Rewrite them to the B-W10 rules as built: entries named by what was waited for, in `waitDetails` order, zero-second entries left out; a `waiting` step ends with `still waiting for <what>`, or `still waiting on <cause>` when the step has no `waitingFor`; `not reached (<cause>)` unchanged; the popover's `Blocked by:` part shows the same text. Wording is the implementer's; the doc describes rules, not measured times. Also fix any other sentence in that doc that quotes the old run-cell wait text (the popover sentence at the top of the page does not quote it at the base).

**Out of scope:** the engine, `wait-detail.ts`, the API and OpenAPI (SGS-192); the help modal text; the rest of `docs/aoe4-build-order-ui.md` (charts, markers, zoom, help modal; SGS-200), the format and model docs and the format doc's `step-stuck` example (SGS-200); `not-reached` wording; trigger details for `not-reached` steps; the long-wait and flag rules.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] A `completed` or `in-progress` step with `waitDetails` entries reads `<text> <m:ss>` per entry with `seconds > 0`, joined with `, `, in `waitDetails` order (not in the old resources, villagers, population, prerequisite order), where `<text>` is `waitDetailText` of the entry's detail; with no entry it reads the empty string. A test fails if a zero-second entry is printed, if the order is re-sorted by reason, or if an entry prints its reason name (`resources`, `prerequisite`) instead of its detail text.
- [ ] A `waiting` step whose `waitingFor` is set reads its entries (if any) then `still waiting for <waitingForText>`; with no entry, only the tail. A `waiting` step whose `waitingFor` is null reads its entries then `still waiting on <waitingOn>`. A test fails if the two tails are swapped or the `for` form is used with a null `waitingFor`. Every entry with `seconds > 0` is printed, including one whose target is the thing `waitingFor` names (an `age` entry before `still waiting for Castle Age`); a test fails if such an entry is omitted (`waitTargetKey` plays no part in the text). (respec 2)
- [ ] A `not-reached` step still reads `not reached (<waitingOn>)`, whatever `waitingFor` and `waitDetails` hold (a test gives it non-empty `waitDetails`).
- [ ] `StepRun` has `waits` and `waitingForText` and no `waitBreakdown`, and `formatWaitBreakdown` no longer exists: deleting the export makes any leftover reference a type error (the typecheck proves it); a test asserts a built `StepRun` has no `waitBreakdown` key.
- [ ] The run cell (`step-blocked-by`) and the gutter popover's `Blocked by:` part show the same new text for a step, because both read `blockedBy`; `annotationDetailText` keeps its forms (`Waited <m:ss>. Blocked by: ...`, `Still waiting. Blocked by: ...`, `Blocked by: nothing` for an empty `blockedBy`) and the existing tests of them keep their assertions apart from the `blockedBy` inputs.
- [ ] `longWait`, `flagged`, `waitedText`, `finishedText`, stale dimming and alignment behave as before: their existing tests pass with no changed assertion.
- [ ] Acceptance: the three cases in Scope pass in the browser, each with its API facts asserted first and its expected text built from those facts (entries with `seconds > 0` in order, then the tail for a `waiting` step), never from an assumed time or entry list; the Table view's `step-blocked-by` and the Text view's gutter popover both show the full text for the Castle Age case, and the spec fails if the text is only the tail while the step has a non-zero entry. (respec 2) The busy case first asserts that step 2 has exactly one `waitDetails` entry with `seconds > 0` (the `building-busy` one), then that the cell equals that entry's `a free <name>` text (a leading `The ` dropped) and its `formatMinSec` time. (respec 1)
- [ ] Docs: the run-cell paragraph of `docs/aoe4-build-order-ui.md` describes the B-W10 rules (entries named by what was waited for, in recorded order, zero-second ones left out; the `still waiting for <what>` tail and the `still waiting on <cause>` fallback; `not reached (<cause>)`), and no sentence there still says the causes are listed in the fixed resources, villagers, population, prerequisite order. `git grep -n "in that order" -- docs/aoe4-build-order-ui.md`, which matches that run-cell sentence at the base, matches no wait sentence after the change. (respec 1)
- [ ] The page builds the wait text from the result only (A2): a test gives a `waitDetails` entry whose detail disagrees with `waitBreakdown` and shows the printed text follows the detail.
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-16

- Underspecified: the UI doc's run-cell wait sentences, which this change makes untrue, were deferred to the docs ticket; the busy acceptance case read only part of the API (one entry present, not the only non-zero one) and left the `The ` drop implicit; the Castle Age and Barracks cases quoted exact text the B-W10 table contradicts.
- Changed: Scope and a criterion now fix the UI doc's run-cell paragraph here; the acceptance cases build every expected text from API facts, the busy case asserts exactly one non-zero entry first; the table-versus-design conflict is an `owner` open question with options (a) and (b), and the cases assert only the tail until it is answered.
- No branch work exists yet (status `needs_spec` before implementation); nothing to keep or discard.

## Re-spec 2 - 2026-11-17

- Underspecified: whether a `waiting` step prints the entry for the target it still waits for; the design acceptance sentence and the B-W10 table disagreed.
- Changed: owner chose option (a) (Q133): the table stands, no entry is omitted; Scope, the `waiting` and acceptance criteria and the Castle Age and Barracks cases now assert the full text (entries, then the tail); the open question is deleted.
- No branch work exists yet; nothing to keep or discard.

## Rework 1 - 2026-11-17 (review)

Findings (reports/SGS-193-review-5.md; review passed tip cd3add99 otherwise):
- `acceptance/aoe4-step-annotations.spec.ts:582-585`, `:541-542`, `:566-567`: new tests repeat the steps of the file's `openTable(page, text)` helper (`:27-32`) instead of calling it.

Required fixes:
- [ ] Busy test: replace lines 582-585 with `await openTable(page, text)`.
- [ ] Loop test: replace `openPage` + `setText` with `await openTable(page, text)`; delete the `showView(page, 'table')` and step-run visibility lines at the top of `expectTableAndPopover`.
- [ ] No assertion changes.
