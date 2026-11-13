# SGS-154 ticket 2 (re-spec)

File: tickets/SGS-154-re-add-unpinned-aoe4-acceptance-coverage.md. Lint clean. Appended Re-spec 2.

Folded in all five blocking gaps and both notes, checked against origin/main and the deleted tests at 27e8840^:
- Item 5: english-1tc, horizon 3600 (input); `idleVillagers` integer >= 0, severity `warning` exactly when > 0 else `info`; depletion-exists precondition.
- Item 2: before-horizon = largest integer below `completedAt` (>= `startedAt`), after = ceil; marker label = step `tech`.
- Item 3: horizon 1800; series by `baseId` 'longbowman' ordered by `tier`, exactly two; tautology replaced by `finalCount` and upper-tier-last-count comparison; before/after samples defined.
- Item 4: horizons 1200 and 3600.
- Item 6: bank = `floating` series rise; setups from deleted tests; `depletedAt` non-null preconditions; only rate-derived instants dropped.
- Notes: LOC wording typo, acceptance typo, item 1 villager count (start plus produce count).

Open questions: none. Overlap: none found. Diagrams: none required.
