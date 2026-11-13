# SGS-150 spec gate 1

Verdict: READY. Risk: low confirmed (test and acceptance-helper edits only; no criticalPaths symbol, no strongModelTrigger).

## Checks
- Grounded scope: verified at origin/main. `describe('run bar at 360x760')` test "scrolls away with the page, and a run does not scroll the page by itself" exists; "scrolls the results heading into view" does not (ticket says so correctly). Step-band test "the start row clears a band set by the other input, ..." exists. `scrollInstantly`, `settledScrollY`, `setDurationInPlace` exist in acceptance/helpers.ts. The described sequences (one-shot `before` read, separate poll then evaluate pair, hover/focus sequence with `expectNoBand`) match the code.
- Criteria are observable; no stale counts, line numbers or quoted function-name criteria. Criterion 4 (break the behavior in a throwaway worktree) and 5 (repeat run, counts recorded by implementer) are rule-based, fine.
- Lessons: the layout-reads lesson (acceptance/**) is cited correctly.
- Invariants none, Contracts none, Open questions none, On merge `none`, Unverified assumptions none (real Chromium, no faked external service). Docs: no doc made untrue. Input validation n/a.
- Throwaway work: no other open ticket in TASK-GRAPH (SGS-143, 146, 149) edits these two specs; grep of tickets found only integrated ones referencing them.

## Notes (non-blocking)
- Criterion 3 ("a late hover cannot make a later assertion pass or fail by chance") is partly review-judged. In the step-band test the first step after `start.hover()` goes from N bands to 0, so a `toHaveCount(0)` cannot pass before the hover lands; the real risk is the unasserted `duration-seconds` focus step (band clearing is never asserted before the next hover). Suggest the implementer assert the cleared state there (adds, does not weaken) or poll one evaluate returning band count and active-row count together.
- `expectNoBand` makes two separate retrying expects (bands then active rows); a single `expect.poll` over one evaluate returning both counts is the cleaner fix.
- Playwright config location was not checked for workers; the implementer chooses worker count for the repeat run (`--workers`), as the ticket allows.
