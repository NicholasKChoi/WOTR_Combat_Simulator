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

- Unchanged: `annotationDetailText` (form and `Blocked by: nothing` for an empty `blockedBy`), `waitedText`, `longWait` and `flagged`, stale dimming and alignment, `step-annotation.tsx` (it renders `run.blockedBy` only; it needs no edit unless `tsc` demands one).
- Existing tests that depend on the changed text or type take the new expected value; a rule, not a closed list. Examples the search found: `step-annotations.test.ts` (the `formatWaitBreakdown` rows go; the `StepRun` table `%s waiting on %s reads ...` and the `annotationDetailText` table are re-expressed with `waitDetails` and `waitingFor` fixtures; its `timing()` fixture takes SGS-192's fields); `step-annotation.test.ts` (its `run()` fixture has `waitBreakdown: []`, which becomes `waits: []` and `waitingForText: null`). `acceptance/aoe4-step-annotations.spec.ts` asserts the `step-blocked-by` text only for `not reached (...)`, an empty value and the popover forms for a completed no-wait step and a not-reached step, so those assertions keep their values; any acceptance spec that asserts the old generic reason text is rewritten to the new forms. The implementer lists every test it edits.
- Tests (`step-annotations.test.ts`): B-W10 rows for each row of the table above; entries with 0 s are omitted; list order is kept (not the old reason order); a `waiting` step with entries gets the `still waiting for` tail after them; the same `StepTiming` with `waitingFor: null` falls back to `still waiting on <waitingOn>`; `waits` text is exactly what `waitDetailText` returns for the entry's detail (use a detail whose text differs from the old reason name, so a test fails if the old reason names are still printed).
- Acceptance (`acceptance/aoe4-step-annotations.spec.ts`), three cases, each asserting the API result first and then the page text from the Table and Text views as the design lists:
  - paste `start 6 sheep -> sheep` and `produce knight from stable x1`: the row's `step-blocked-by` reads `still waiting for Castle Age`, and the gutter popover holds the same text.
  - paste `produce man-at-arms from barracks x1`: reads `still waiting for a Barracks`.
  - paste `produce scout from capital-town-center x1` then `produce villager from capital-town-center`: the spec first asserts from the API that step 2 waited under `prerequisite` with a `building-busy` entry, then asserts its `step-blocked-by` reads `a free <capital town center name> <m:ss>`, where the name and the time come from the snapshot name in the API's `waitDetails` entry and its seconds (design sample: 0:23); the spec does not hard-code a time it did not read from the API.

**Out of scope:** the engine, `wait-detail.ts`, the API and OpenAPI (SGS-192); the help modal text; `docs/aoe4-build-order-ui.md` (the docs ticket documents the wait text); `not-reached` wording; trigger details for `not-reached` steps; the long-wait and flag rules.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] A `completed` or `in-progress` step with `waitDetails` entries reads `<text> <m:ss>` per entry with `seconds > 0`, joined with `, `, in `waitDetails` order (not in the old resources, villagers, population, prerequisite order), where `<text>` is `waitDetailText` of the entry's detail; with no entry it reads the empty string. A test fails if a zero-second entry is printed, if the order is re-sorted by reason, or if an entry prints its reason name (`resources`, `prerequisite`) instead of its detail text.
- [ ] A `waiting` step whose `waitingFor` is set reads its entries (if any) then `still waiting for <waitingForText>`; with no entry, only the tail. A `waiting` step whose `waitingFor` is null reads its entries then `still waiting on <waitingOn>`. A test fails if the two tails are swapped or the `for` form is used with a null `waitingFor`.
- [ ] A `not-reached` step still reads `not reached (<waitingOn>)`, whatever `waitingFor` and `waitDetails` hold (a test gives it non-empty `waitDetails`).
- [ ] `StepRun` has `waits` and `waitingForText` and no `waitBreakdown`, and `formatWaitBreakdown` no longer exists: deleting the export makes any leftover reference a type error (the typecheck proves it); a test asserts a built `StepRun` has no `waitBreakdown` key.
- [ ] The run cell (`step-blocked-by`) and the gutter popover's `Blocked by:` part show the same new text for a step, because both read `blockedBy`; `annotationDetailText` keeps its forms (`Waited <m:ss>. Blocked by: ...`, `Still waiting. Blocked by: ...`, `Blocked by: nothing` for an empty `blockedBy`) and the existing tests of them keep their assertions apart from the `blockedBy` inputs.
- [ ] `longWait`, `flagged`, `waitedText`, `finishedText`, stale dimming and alignment behave as before: their existing tests pass with no changed assertion.
- [ ] Acceptance: the three cases in Scope pass in the browser, each with its API facts asserted first; the Table view's `step-blocked-by` and the Text view's gutter popover both show the text for the Castle Age case.
- [ ] The page builds the wait text from the result only (A2): a test gives a `waitDetails` entry whose detail disagrees with `waitBreakdown` and shows the printed text follows the detail.
- [ ] No INVARIANTS.md regressions

## Open questions

none
