# SGS-111 review 2 (delta, text-only rework 1)

Verdict: **APPROVE**

Scope: `git diff 3844378 ce302bb` (one commit, `docs/aoe4-build-order.md` only, +3/-3).

## Blocking findings

None.

## Required fix check

- Rework 1 Required fix (text), `docs/aoe4-build-order.md:332-334`: **applied verbatim**. The new text reads
  "Whichever kind it is, a house under construction that finishes within the lead counts toward the planner's
  headroom, so an explicit step that starts after auto-houses already cover the demand adds a surplus house."
  This is the exact replacement from review 1. Only line wrapping differs.
- The claim matches the code:
  - `lib/aoe4-build-order/houses.ts:21-23`: `lead` = walk + construction time, `arriving` keeps only `pending`
    items with `completesAt <= state.time + lead`, and `headroom` = `state.supply` + the supply of `arriving`.
  - "Whichever kind it is": `pending` comes from `engine.constructing` (`lib/aoe4-build-order/simulate.ts:638`),
    which holds every building under construction. That includes auto-houses and explicit `build house` steps.

## Spec gaps

None.

## Acceptance criteria

The delta only re-checks the Rework 1 item, which passes. Review 1 verdicts on the other criteria still stand,
because the delta changes no code.

## Invariants touched

None. The change is to docs prose only.

## Linter / bot

- The repo has no lint command for Markdown. `package.json` has only `lint:dup` (jscpd), and it does not apply
  to this prose change.
- No review bot is configured for this project.

## Non-blocking notes

- `docs/aoe4-build-order.md:334` is now 142 characters long because the paragraph was not rewrapped. The file
  already has 161 lines over 110 characters, and nothing in the repo enforces a wrap width, so this is cosmetic.

## Coverage

Reviewed: the full delta diff, `lib/aoe4-build-order/houses.ts`, and `lib/aoe4-build-order/simulate.ts:630-650`.
Not reviewed (out of delta scope): the rest of the branch, which review 1 covered.
