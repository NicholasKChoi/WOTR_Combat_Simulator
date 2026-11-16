# SGS-184 implementer report 2 (rework 1)

- Ticket SGS-184, branch sgs-184-one-desktop-layout-width-floor, tip 9b06cb95dcdd1a35c54ace13e17528c307321f97 (on 09023924), checkout /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-184-one-desktop-layout-width-floor. The branch has no origin ref, so no own-commit check applied; checkout.sh was not re-run (checkout existed, clean at the previous tip).

## Files touched
- acceptance/aoe4-min-width.spec.ts: resize loop wrapped in `expectNoRun`; the hand-rolled request listener and 500 ms wait removed; `SPLIT_VIEWPORT` replaces both 1280x800 literals.
- acceptance/aoe4-split-layout.spec.ts: hydration/first-run case holds the first simulate with `holdNextSimulate`, asserts status is not `current`, reads column lefts null-safely, asserts both non-null, releases via `waitForRun`, then compares before and after.
- Ticket: both Rework 1 boxes ticked.

## Tests
- tsc --noEmit clean; lint:dup 0 clones; the two specs: 9 passed (aoe4-split-layout and aoe4-min-width). The full suite was not re-run: only these two spec files changed and no production code changed.
- Invariants encoded: no simulate request during the resize across 1200 (including the debounce window); columns identical before any result and after the first run.

## Mutation checks
- workbench-columns.tsx: Results column rendered only when a result exists. The hydration case failed at `expect(before.every(left !== null)).toBe(true)` (Received false). Reverted via git checkout; tree clean.
- aoe4-min-width.spec.ts resize loop: added a simulate POST per resize step. `expectNoRun` failed at helpers.ts:239 `expect(posted).toEqual([])` listing the posts. Reverted (I reapplied my fix after the checkout wiped it; the committed file is the fixed one, tests re-run green afterwards).

## Doc claims
None added. Build/codegen: no code change in this pass, not re-run. Lint (tsc + lint:dup) passed.

## Unverified assumptions
None added. Out-of-scope findings: none.

Status: needs_review
