# SGS-133 ticket author, re-spec 3

File: projects/strategy-game-sim/tickets/SGS-133-split-scroll-anchoring-and-run-bar-cap.md (lint clean).

Folded in the designer's revised M9.12 and nothing else:
1. Case (a): bar top 0 within 1px (criterion 1, tagged respec 3).
2. Scope's capped state is the (b) list: storage throws, clipboard rejects, Save as copy, click copy-saved-link (hint shows), reopen the copy form; copy-name error optional. The cancel-below-bar rule and add-content ladder are gone.
3. Criterion 5 replaced by the two (c) checks: `my-builds-unavailable` below the bar bottom at scrollTop 0 and inside the run-bar rect at max scrollTop; `build-order-select` top above bar top at max scrollTop, rect inside run-bar after `locator.focus()`. The precondition criterion (3) now lists the hint and requires the overflow only.
4. The `auto-run-status` criterion and its precondition are removed; Scope says to drop any position-only test of it.
5. Criterion 3 requires the `max-height: 40dvh` to `none` mutation to fail, including the (c) content check; the report notes the run.

Appended Re-spec 3 (branch work stands except the capped-state tests). No open questions, no diagrams, no overlap. The ticket had no Rework or Required-fixes section to preserve; the manager's rework section, if any, is not in the file.
