# SGS-095 spec gate 2

Verdict: NEEDS_SPEC

Checked against origin/main (9274372 or later) with `git show` and `git grep`.

## Gate-1 gaps: closed
- Item 4 now fixes the hydration signal: `page.waitForFunction` on a `__reactProps$` own property of `#fight-form`. It requires the helper even if the flake does not reproduce. `pages/apps/combat-simulator.js` has `id="fight-form"` and `onSubmit={submitFight}`, so the signal is plausible.
- Schema mutation check: only the 5000-character `houseBuilderSource` row exceeds 1000 characters. Every other `houseBuilderSource` use in schema.test.ts is short ('wood', 'gold#2', 'gold', 'fish', 1). The check holds.
- The describe-body criterion now forbids execution, not definitions.

## Gaps
1. Acceptance criterion 2 (step-index mutation check) - "inserting one extra `pause` step at the start" is underspecified and probably cannot hold. A `pause` step needs a `producer` (see parse-text.test.ts: `{ action: 'pause', producer: 'capital-town-center' }`). A pause of the Town Center at the start would change villager production. That would shift the pinned `CASTLE_LANDMARK_SECONDS` (681) and `MAN_AT_ARMS_START_SECONDS` (696.409...), so the timing tests would fail for a reason unrelated to the step index. An implementer would guess the producer and trigger, and might get a false failure. Fix: name a step that does not change the simulation, for example a pause on a producer the build never uses, or a `rally` to the node already in use. Or state the property: "an inserted step that leaves every other step's timing unchanged shifts the men-at-arms index by one, and this spec still passes". Have the report record the exact step inserted.

## Notes
- `acceptance/fight-api-caps.spec.ts:120` also does `goto('/apps/combat-simulator')` followed by `networkidle`, so it has the same race. The ticket scopes the helper to three specs and the grep criterion only covers `combat-simulator*.spec.ts`. Either add it (one more call site) or state that it is left alone. A line in Scope is enough.
- `acceptance/helpers.ts:97` `openPage` uses `networkidle` for the AoE4 page. This is out of scope as stated and needs no action.
- Item 4's reproduction clause names several commands and "at least 10 repeats". That is a property, not a stale pin, and is fine.
- Risk low, Invariants none, On merge none, Depends none, Diagrams not needed, Open questions none, and no LESSONS conflict. The Playwright lesson is about layout reads and does not apply. Docs: no doc names these test details.
