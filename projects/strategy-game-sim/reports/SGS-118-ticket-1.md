# SGS-118 ticket author, re-spec 1

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-118-acceptance-test-debt.md
(rewritten in place; `## Re-spec 1 - 2026-11-10` appended; ticket-lint clean).

## Summary

"Share one request-hold helper and make the weak acceptance specs able to fail", component aoe4-build-order,
risk standard, about 250 test lines with no business logic, depends on nothing. Read at origin/main b3da879. It
covers M8.7 (the "acceptance" and "helpers" rows) and M8.8 (acceptance import order). Criteria cover these
areas: the two helpers and their semantics; mutation checks that pin the helper (the gate removed, the duration
filter ignored, nothing held); no local hold functions or hand gate routes; no hand-listed chart arrays;
duration-error visibility; the open-rows data precondition; the aria-describedby id resolving to the status
element; the rewritten charts-dim test; step-started before the layout measure; code-point import order; and an
acceptance, tsc and lint:dup pass.

## Gate findings folded in

1. Chart-id grep: now `git grep -nE "\[ *'chart-units-produced'" -- 'acceptance/*.spec.ts'` finds nothing. Today
   it matches exactly the four places Scope edits (auto-run, step-band, compact-view, results-split). It no
   longer matches `aoe4-narrow-layout.spec.ts`, the chart-readability subset, or `RESOURCE_CHARTS` and `CHART_IDS`
   in helpers.ts. Those lists are named in Scope as staying.
2. Import order: the rule is now the default `Array.prototype.sort` (code-point) order. I checked it against
   origin/main: every edited spec already complies except `aoe4-auto-run.spec.ts`, where `TABS_VIEWPORT` moves to
   after `SIMULATE_PATH`.
3. Hold semantics: the helper holds every matching request until release, and later ones pass. Today's copies
   and the contract test's double hold rely on this. Requests that do not match go to `route.fallback()`.
   - Carriers: the contract status-line test asserts no response before `release()`. The pin-compare test "a
     run that finishes before the restore lands ..." completes a 600 s run while `LOAD_DURATION` is held, and
     asserts the held response arrives only after `release()`.
   - Each carrier has a mutation check: gate removed, filter ignored, nothing held.
4. Notes:
   - The charts-dim test now uses `holdNextSimulate` with a real input (`listBuilds()[1]`). The same-build half
     now uses `expectNoRun`.
   - The open-rows test now asserts a newly opened row and a kept row. I checked `BUILDS[2]` against the shipped
     JSON: newly opened rows exist (for example index 14), and index 0 is kept.
   - results-split asserts DOM order against `CHART_IDS`.
   - The pin-compare `routeRestore` routes and the gated 500 fulfil are named as staying.
   - The `aria-describedby` check applies only where the attribute is expected. Its mutation moved to the status
     element's `id` in `build-input.tsx`. The old mutation (the attribute value in `results.tsx`) already failed
     the existing text assertion, so it proved nothing.

Other fixes found while exploring:
- step-band's `page.unroute((url) => ...)` calls pass a new function, so they never removed the route. Scope
  deletes them.
- Exact status texts for the describedby check come from `autoRunStatusMessage`.
- tsc has no `noUnusedLocals`, so the unused-import check is a review item.

## Named-create hold for SGS-125 (decision)

SGS-118 provides it generically. It adds `holdRequests(page, path, method, matches?)` in `acceptance/helpers.ts`,
and `holdNextSimulate` is a thin call to it. SGS-125 should hold the named-build create with
`holdRequests(page, '/api/aoe4-build-order/named-builds', 'POST')` (or a path constant its ticket adds) instead of a
`holdNextNamedCreate`. Its "no local hold route" rule then applies to every hold. SGS-118 adds no non-simulate
caller. `aoe4-save-open.spec.ts` (gate fixture holds) is left to the my-builds tickets.

## Criteria run against current code

- `git grep -nE "function hold[A-Za-z]*" -- acceptance`: today it matches the five local copies Scope deletes. In
  the end state it matches only helpers.ts.
- `git grep -nE "await gate" -- 'acceptance/*.spec.ts'`: today it matches the Scope 2 holds plus pin-compare's
  restore fulfil and aoe4-save-open. The end-state allowance covers exactly the last two.
- Chart grep: see finding 1 above.
- Import order: checked with a script over the seven edited specs.
- Mutation checks were not run: the assertions they target do not exist yet. The implementer runs and records
  them.

## Diagrams

None. It is a single-component, test-only change: "no diagram required".

## Open questions

- designer: the design/M8.md M8.7 "helpers" row says "holds the next matching POST" and does not name
  `holdRequests`. Record that the helper holds every matching request until release, and record
  `holdRequests(page, path, method, matches?)`, which SGS-125 uses.

## Overlap

- SGS-114 redefines `CHART_IDS` in helpers.ts. Its criterion limits its acceptance diff to helpers.ts and the new
  spec. The specs here work with either definition.
- SGS-116 edits other tests in `aoe4-step-annotations.spec.ts`.
- SGS-113 edits the legend tests in `aoe4-build-order-pin-compare.spec.ts`.
- SGS-115 may add helpers.
- SGS-125 depends on this ticket for `holdRequests`. Its Scope should be changed to use it.
