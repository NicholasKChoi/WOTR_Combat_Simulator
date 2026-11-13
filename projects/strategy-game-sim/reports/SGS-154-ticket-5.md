# SGS-154 ticket author, re-spec 5

File: `$PROJECT_DIR/tickets/SGS-154-re-add-unpinned-aoe4-acceptance-coverage.md` (lint clean).

Cause: re-spec 4 stated "a count above 1" for item 6(b) after probing only count 3. The `order` helper sets `autoHouses: false`, so the population cap limits villagers and larger counts break the rule.

Changes:
- Item 6(b): produce count fixed at 2 (the deleted test's value, an input). A second precondition: the villager series' last count is at least the count. `idleVillagers` stays between the count and the series' last count. The criterion is restated and tagged (respec 5).
- Free-input check: item 1's count, item 6a's stock and item 6c's stocks were left free, so they held only at the probed value. They are now fixed at the deleted tests' own values: `produce villager` x3 (with a precondition on the count), stock 601, and stocks 100 and 300. Gate 5 verified those values at 1200 s and 3600 s. Item 7 already fixes 40. Items 2 to 5 take their inputs from builds or fixed horizons.
- I did not run a new probe. The pinned values are exactly the ones gate 5 probed at origin/main 41b3ed3. A `## Re-spec 5` section is appended.

No open questions, no diagrams, no overlap with open tickets.
