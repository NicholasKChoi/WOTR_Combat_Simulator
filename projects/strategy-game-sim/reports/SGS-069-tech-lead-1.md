# SGS-069 tech-lead 1

**Decision: PASS, draft PR opened**

- PR: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/65 (draft, base `main`, head `sgs-069-aoe4-timeline-blocked-by-compare` at b00e8af1a9c2a00fea7626327c2f1e12fdd82ae8)
- Title: "Merge the step timeline wait columns into Blocked by and add compare deltas with reasons"
- Single PR, so there is no stack footer. The body was set through `gh api -X PATCH`.

## Merge risk (verbatim from body)
**low** - display-only components with no API, schema, CLI or config change and no critical-path symbol; the changed exported types (`KeyNumbers`, `CompareRow`, `TimelineRow`) have no consumer outside their own folder; a revert fully undoes it; unit and acceptance tests pin the new text, omission and direction rules.

## Review focus (verbatim from body)
No hotspots: the change only formats an existing response. The two rules that could mislead a user are the omit filter and the better/worse direction (`compare.ts`), and both are pinned by unit tables and acceptance tests that fail when either is mutated.

## What I reviewed
- Commit range: origin/main 54d7e90..b00e8af (4 commits, all authored by choinickolas@gmail.com, with no ticket ids or PR numbers in the messages).
- Files: 12 files, +401/-110 in total. Reviewable production code is +99/-60 across 4 files (compare.ts, compare-panel.tsx, step-timeline-rows.ts, step-timeline.tsx). The docs change is +19/-9.
- Consumers: `keyNumbers`, `compareRows`, `KeyNumbers`, `CompareRow`, `TimelineRow` and `timelineRows` are used only inside `components/apps/aoe4-build-order/`, so no external contract breaks.
- Invariants: A1-A3 hold, because nothing is touched under lib/, data/ or pages/api/. S1 holds, because there are no cross-app imports. No criticalPaths symbol is touched.
- Open questions: CONTEXT.md lists none, and the ticket lists none.
- Security, irreversibility and concurrency: none.
- `overflow-x-auto` is in the installed Bootstrap 5.3.8.
- Ticket criterion 14 is met: the PR body lists every edited existing test (compare.test.ts, three pin-compare tests, one m3-flow test, and the acceptance/helpers.ts addition).

## Non-blocking notes
- The PR is the first push of this branch to origin, so the Vercel preview status has not been checked yet.
- Carried from review: step-timeline-rows.test.ts asserts `LONG_WAIT_SECONDS` equals 60, which only restates the literal. A time delta under 0.5 s renders `0:00 earlier`.
- A `waiting` row never gets `longWait`, because the engine reports `waitSeconds` 0 for waiting steps. This matches the spec as written.
