# SGS-193 ticket report 3 (re-spec 2, Q133 option (a))

Ticket: tickets/SGS-193-step-annotations-name-the-wait.md. Lint: clean (rc 0).

## Changes
- Scope: new "Decided (owner, respec 2)" bullet: table final, a waiting step prints all entries then the tail, nothing omitted by `waitTargetKey`; wording saying the Castle Age/Barracks cell is exactly `still waiting for ...` is wrong and must not be copied into tests or docs.
- Acceptance cases (Castle Age, Barracks): assert the full text built from API facts (entries with seconds > 0 in order, then the tail), e.g. `Castle Age 20:00, still waiting for Castle Age`, `a Barracks 20:00, still waiting for a Barracks`; popover equals cell.
- Criteria: the `waiting` criterion and the acceptance criterion rewritten (tagged respec 2); the "until answered" hedges are gone; a test fails if an entry naming the same target as `waitingFor` is omitted.
- Open question deleted (`none`). Re-spec 2 section appended.

## Design correction needed (not edited)
File `design/M11.md`, row "M11.5b specific waits" (line 147, test-plan column, the Acceptance sentence). Two spots:
- Current: `the row's `step-blocked-by` reads `still waiting for Castle Age` and the gutter popover holds the same`
  Replace with: `the row's `step-blocked-by` reads the step's non-zero wait entries then the tail, e.g. `Castle Age 20:00, still waiting for Castle Age` (the spec builds the text from the API's `waitDetails` and `waitingFor`), and the gutter popover holds the same`
- Current: `one with `produce man-at-arms from barracks x1` reads `still waiting for a Barracks``
  Replace with: `one with `produce man-at-arms from barracks x1` reads the entries then the tail, e.g. `a Barracks 20:00, still waiting for a Barracks``
Other design lines (22 example `still waiting for Castle Age (King's Palace)`, 247-249 B-W10 table) are consistent: line 22 is a tail example, not a whole-cell claim.

## SGS-200
No required change. Its Scope and criteria only check the UI doc against the B-W10 table as built. Optional cleanup: in its Wait text bullet (line 31), delete the stale parenthetical "(follow SGS-193's as-built text if its open owner question is answered later)", since the question is now answered and removed.

## Overlap
None new.
