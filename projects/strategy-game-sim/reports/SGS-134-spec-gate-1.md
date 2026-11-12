# SGS-134 spec gate 1

Verdict: NEEDS_SPEC

Read at origin/main. SGS-128 has no local branch yet, so I read its ticket for the end state of `storage-test-helpers.ts`.

## Gaps

1. **Hook storage write vs. existing acceptance test (Scope `use-chart-layout.ts`, criteria "existing `aoe4-chart-layout.spec.ts` passes unchanged" and "reload case")**
   - What is missing: the rule for the write on load when nothing is stored.
   - Why an implementer would guess: Scope says one effect on `[layout, loaded]` writes whenever `loaded` is true, and the mount effect sets `loaded: true`. With nothing stored, that effect writes the default layout straight after load.
   - The existing spec `acceptance/aoe4-chart-layout.spec.ts` line 55 ("with no stored layout ... loading writes nothing") asserts `stored(page)` is `null` after load.
   - So the ticket's own end state breaks a test it says must pass unchanged. The design wording "the first write echoes the stored value" does not cover the empty-storage case.
   - Proposed fix: pick a rule and state it in Scope, then align the criteria.
     - Option A (recommended, keeps the test unchanged): the write effect skips until the layout has changed from the one the mount effect read. For example, keep a ref to the loaded layout and write only when the layout is not that same object. Then storage is untouched until the user moves or collapses something.
     - Option B: the write is allowed on load. Then Scope must list `aoe4-chart-layout.spec.ts` line 55 as a test to change (the ticket agent's rule for tests that assert absence), and the "passes unchanged" criterion must say "except".
   - Either way, state that the Playwright criterion "a stored value is not overwritten by the default" holds. This conflicts with design C2 and its Behavior table ("a write never happens before that read"). C2 is satisfied by both options, so no owner call is needed unless Option B is chosen.

## Notes (non-blocking)

- Criterion 8 says "viewport that shows the results column". Name the helper instead, for example `TABS_VIEWPORT` with `showTab(page, 'results')`, or `SPLIT_VIEWPORT`. Existing helpers are in `acceptance/helpers.ts`.
- C4 says `compare-body` has a bare `data-collapsed`. The convention in `line-chart.tsx` is `data-collapsed="true"` or `"false"`. State that the value is the string `'true'` or `'false'` so the Playwright `[data-collapsed]` selectors and the static markup test agree.
- The current `ComparePanel` root is `<div className="mb-3">`. The ticket changes it to a `compare-panel` section. Say whether `mb-3` is kept, so the spacing under the results column does not shift.
- Checked, no gap:
  - Every named file exists, or is marked new.
  - `useChartLayout(` is called only from `results.tsx` today, so the search criterion holds after the change.
  - `results-heading` and the `h3` font-size checks in `aoe4-split-scroll.spec.ts` and `aoe4-small-screen.spec.ts` are unaffected by a new `h3.h5` "Key results".
  - `docs/aoe4-build-order.md` lines ~993-1008 are the only doc statements affected. `ARCHITECTURE.md` has no matches for the names.
  - Contracts match `design/M9.md` C2, C3 (`CollapseCaret`), C4 and C5.
  - Risk `standard` is fine: no critical path or invariant path is touched.
  - Size of about 180 LOC is fine.
  - The ticket has no open questions.
  - `On merge: none` is correct.
  - The `Unverified assumptions: none` entry is acceptable because the browser behavior is covered by Playwright rather than a fake.
- SGS-128's `fakeStorage(entries?)` takes entries keyed by storage key, while the current local copy in `chart-layout.test.ts` takes a raw string. The ticket's "delete local copies if the dependency has not already" covers this, but the implementer must adapt the call sites (`fakeStorage({ [CHART_LAYOUT_STORAGE_KEY]: raw })`).
- Overlap with SGS-135 is acknowledged in Scope (it keeps `move`, `pendingFocus`, Up and Down), so it is not throwaway work.
