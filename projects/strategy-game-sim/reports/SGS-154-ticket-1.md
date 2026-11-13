# SGS-154 ticket re-spec 1

Ticket: tickets/SGS-154-re-add-unpinned-aoe4-acceptance-coverage.md (lint clean).

- Item 4 (auto-houses-held) moved to Dropped, with no replacement. Its acceptance bullet is removed. Items are renumbered 1 to 7.
- Old item 5 is now item 4. It selects the first `produce man-at-arms` step with a time trigger. `armedAt` equals that trigger's seconds. `startedAt >= armedAt`. `waitBreakdown.resources` is within 1e-3 of `startedAt - armedAt`. No step has status `waiting`. The ticket notes that a unit test already pins arming, so this covers the API wire path. The acceptance bullet is updated and tagged (respec 1).
- Item 1's key list is now derived from the `SimulationResult` schema `properties`, via `schemas` in `acceptance/openapi-schemas.ts`.
- LOC estimate corrected: veterancy-conversion is the only restored file.
- Appended a Re-spec 1 section.

No open questions. No diagram needed.
