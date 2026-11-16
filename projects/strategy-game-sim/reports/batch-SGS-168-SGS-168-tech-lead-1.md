# Tech-lead gate: batch SGS-168-SGS-168

## Decision

NEEDS HUMAN REVIEW - no PRs opened

Nothing pushed. No PR was created (none existed for the branch: `gh pr view sgs-168-combat-doc-not-modeled-claims` reports no pull requests).

## Blocker

- `docs/combat-simulator.md:100` (on origin/main; the line the diff deletes) - open question answered unilaterally / contract break - The commit cuts "A request for N = 100,000 completes within 10 seconds." because the ticket says no test or acceptance spec measures or asserts that duration. That premise is false. `acceptance/fight-api-battles.spec.ts:5` sets `TIME_BUDGET_MS = 10_000`, and `acceptance/fight-api-battles.spec.ts:219-231` (describe `time budget`) runs two worst-case matchups (0/10/0 vs 0/10/0 and 0/10/5 vs 0/10/5) at `battles: 100000` and fails if either exceeds that request timeout. The requirement was set on purpose: SGS-005 acceptance criterion "(respec 1) Time budget (S3)" (tickets/SGS-005-n-battle-outcome-frequencies.md:277-280, :314) and SGS-006 (tickets/SGS-006-fight-api-contract.md:193) cite a "WOTR time budget" decision, and the measurement backs invariant S3 (bounded request time). After merge, the rules doc is silent on a requirement the acceptance suite still enforces, so the next reviewer who judges combat against the doc sees an unstated rule in the spec (or a later docs pass deletes the test as undocumented). Review (SGS-168-review-1.md:18, :34) repeated the false "nothing in tests states it" finding; its grep missed `acceptance/`.
  - Why a human must decide: either keep a performance requirement the owner set earlier, or drop it. Dropping it is the owner decision the ticket itself says it does not make ("A performance target needs an owner decision plus a measurement; none is requested").
  - Direction: most likely, rework SGS-168 to keep the 10 s sentence (restore the hunk at lines 97-101) and cut only the "planned for a later release" sentence, which nothing backs. Fix the ticket's evidence table so it cites the acceptance spec. The other option, if the owner wants the target gone: drop it in the doc and the `time budget` acceptance describe in the same diff, and record the decision.

The other hunk ("Support for them is planned for a later release." in "Not modeled") is fine: no code, test, or design doc backs it, and PROJECT.md Out of scope keeps the roadmap.

## Untested hotspots

None (docs-only change).

## Reviewed

- Range: `origin/main..edbb1b37d28899fced4e61b9c3d0f0a32b7adbc8` (1 commit, edbb1b3 "Cut the unmeasured timing and roadmap sentences from the combat rules doc").
- Files: `docs/combat-simulator.md` (+1/-4). No code, test, or config change.
- Checked: INVARIANTS W1, W2, S3; PROJECT.md Open questions (none) and Out of scope; the default and max N in the doc still match `DEFAULT_BATTLES = 1000` / `MAX_BATTLES = 100000` in `lib/combat-simulator/simulate.ts:5-6`; a repo grep for the two removed claims found the acceptance timing test.

## Non-blocking notes

- If the PR is opened later with the time-budget sentence restored, its Merge risk is `low` (docs only, a revert undoes it, no public surface or criticalPaths symbol) and it has no Review focus entries.
- No issue line: the ticket's Source names a BACKLOG item, not `GitHub issue #<n>`.

## Cleanup

Scratch `worktrees/tech-lead-SGS-168-SGS-168` removed after this report (see the caller summary if removal failed).
