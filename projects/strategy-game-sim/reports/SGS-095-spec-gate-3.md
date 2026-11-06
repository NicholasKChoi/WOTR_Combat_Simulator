# SGS-095 spec gate 3

Verdict: READY

Checked against origin/main with `git show` and `git grep`, after a fetch.

## Gate-2 gaps: closed
- Criterion 2 now names a concrete step and states the property it must have. It also requires the origin/main contrast run and has the report record the step JSON. The step is `{ "action": "rally", "producer": "capital-town-center", "to": "sheep" }`.
  - The build's `start.rally` is `sheep`.
  - The build's rally to `wood` at 20 s overwrites the inserted step.
  - Step 0 today is an untriggered `produce villager`, so an untriggered `rally` before it is valid.
  - The ticket tells the implementer to pick another step if a pinned timing moves, so the criterion survives a wrong guess.
- `acceptance/fight-api-caps.spec.ts:119-120` is now a fourth helper call site. The grep criteria match origin/main: `networkidle` appears in the three combat-simulator specs, `fight-api-caps.spec.ts`, and `openPage` at `helpers.ts:97`. `goto('/apps/combat-simulator')` appears in the same four specs.

## Spot-checks
- `MAN_AT_ARMS_STEP = 34` at line 8 of the spear/longbow spec is used at line 35. Step 34 is the first `produce` `man-at-arms` step, with a time-681 trigger. Later men-at-arms steps (49 and up) carry `instance`. This matches Scope item 1.
- `schema.test.ts:339-372` matches item 2. `cases` is built by `flatMap` at describe-body time, calling `run` and `expected`, and the title ends in `%#`. The `houseBuilderSource` 5000-character row is the only one over 1000 characters, so the mutation check holds.
- `simulate-house-warnings.test.ts:167` carries the "Re-pinned for villagerTarget" comment. It is a change-history note, so deleting it is justified.
- React is 19.x and Next is 16.x. `__reactProps$` is set on hydrated DOM elements, so the signal is plausible.

## Other checks
Risk low (test-only), Invariants none, On merge none, Depends none, Open questions none, Diagrams not needed, Docs (no doc names these test details), and Input validation (n/a) all pass. No criterion pins a stale number: 681 and 696.409 are existing constants, and the digests stay unchanged.

## Notes (non-blocking)
- The criterion 9 order check and the "at least 10 repeats" clause are properties, so they will not go stale.
- The gate did not run the reproduction or the mutation checks. Those are for the implementer.
