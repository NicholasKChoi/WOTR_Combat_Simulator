# SGS-003 tech-lead gate - 2026-10-29

## Decision
NO BLOCKERS. I pushed `sgs-003-validate-fight-inputs` at 61a777de92d7d6931b80b7f668752acca3db7808 and opened draft PR #17 against main: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/17. I added no new commits, and both commits are authored by choinickolas@gmail.com.

- This is a single PR, so there is no stack. I did not run `gh stack link` and did not write a stack footer, the same handling as batch 1.
- The push itself succeeded (`git ls-remote` shows 61a777d). `git push -u` could not write the upstream tracking config, because `.git/config.lock` already existed (probably another agent's git operation). This affects local config only.
- I set the PR body with `gh api -X PATCH` (`gh pr edit` is broken in this repo).

## Reviewed
- Range: origin/main 7fd4c91..61a777d (2 commits: 018b3f4 feat, 61a777d refactor).
- Files: `pages/api/fight.ts` +96/-17, `pages/apps/combat-simulator.js` +39/-14, `components/apps/combat-simulator/army.js` +31/-16, `acceptance/helpers.ts` +18/-3, plus two new acceptance specs (+359).
- Reviewable LoC: +184/-50.

## Checks
- Invariants:
  - S3 is now enforced before `Battle` for all six inputs.
  - W1: the bounds match CONTEXT.md Decisions, and the combat code is unchanged.
  - W2 is untouched.
  - S1 and S2 hold. The diff removes the API's import of a component; it adds no cross-app import.
- Termination: with fighters >= 1 per side, combat strength strictly decreases on every hit, including the existing negative-regulars path in `takeHit` (SGS-004). The loop stays bounded.
- Contract: before this change, any input was accepted. Now invalid inputs get 400 and non-POST methods get 405, which is the intended contract change (owner decisions 3-5). The only consumer is the page, and it was updated in the same diff. The response shape is unchanged.
- Irreversibility, concurrency, security: nothing new.
  - No secrets and no logging of input.
  - Form-encoded POSTs are accepted, which means a cross-site form can trigger a bounded, side-effect-free simulation. That is acceptable, and SGS-006 decides the content-type contract.
- Open question 6 (wrapping malformed JSON) is left open, not answered.

## Non-blocking notes (carried in the PR reviewer guide)
- Form-encoded bodies are accepted (SGS-006 decides).
- Caps are duplicated in `fight.ts` and `army.js` (move to `lib/` later).
- `fillArmies` is order-sensitive.
- `submitFight` has no in-flight guard (predates this change).
- SGS-009 tracks the stale lines in `docs/combat-simulator.md`.
