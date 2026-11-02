# SGS-039 spec gate 4

Verdict: NEEDS_SPEC (one small gap, no owner input needed). Everything the re-spec 4 changed checks out.

## Verified (SGS-038 branch tip 12f0c53, rebased onto 77fa279)
- Docs grep (`Resources are infinite|At most one step is armed|is not .time. or .villagers.|no amount ships|until amounts ship`, case-insensitive) on the tip finds exactly 5 lines: 27 (finite-node bullet, "no amount ships in the data yet"), 155 ("At most one step is armed"), 344 ("until amounts ship in `rules/base.json`", the paragraph before Depletion, lines 343-344), 351 (Stock paragraph, "No amount ships yet"), 494 (`unknown-trigger-kind` row, "is not `time` or `villagers`"). The three named sentences match the text word for word. 0-after is achievable.
- README on the tip: "never depleted" at line 71 and "keep running by 3600 s" at line 40, one line each, as the criteria say.
- The four default-amount tests exist on the tip under the quoted titles (`simulate-depletion.test.ts` 105 and 115, `validate.test.ts` 595 and 601; the depletion spec rename is also on the tip).
  - "keeps every ref infinite": asserts `amount: null, depletedAt: null` per row plus `warnings: []`. Fix (amount per row = 3000/1500/1750/2000/4000/1200, drop the depletedAt and warnings asserts) is right; a default empty order can run sheep dry, so dropping those is correct.
  - "default each deposit to gold amount": the cloned `editGameData` sets gold 3000. On the default game with `{ gold: null }` gold is null and `gold#2` is 4000 (deposits take the base gold amount, not the override); with `{ 'gold#2': 2500 }` gold is 4000. Right.
  - "returns every finite ref": key order stays; values sheep 3000, berry 1500, deer 1750, boar 2000, stone 1200, gold and `gold#2..#8` 4000. Right.
  - "defaults every deposit ... merges overrides": with overrides `{ gold: null, 'gold#3': 2500, berry: 0 }` the existing test already expects `gold#2` 4000 beside `gold` null, so the expected `{ gold: null, 'gold#2': 4000, 'gold#3': 2500, 'gold#8': 4000, berry: 0, sheep: 3000 }` is right.
- Rebase note matches the tip (new test titles present). ENG 1TC note is consistent with the earlier basis.

## Gaps
1. `docs/aoe4-build-order.md` Scope and the docs criterion - they miss statements the default amounts make untrue, so an implementer who edits only the named sentences and the grep leaves false text. Scope promises "every statement this ticket makes untrue".
   - Line 606-607 (Results/`depletions` bullet): "With no `nodeAmounts` every `amount` is `null` and `warnings` is empty". After this ticket the default amounts are the six values and the default ENG 1TC run emits warnings. The grep does not catch it.
   - Line 62 (bounds table, `nodeAmounts` values): "..., else infinite" is now only true for `farm`-free refs with no amount; reword to "`gatherNodes.<node>.amount` (gold's for `gold#k`); `null` is infinite".
   - Line 708 (extension-points row "Shipped node amounts, positions, per-deposit trips"): amounts now ship, so drop "Shipped node amounts" from the row (positions and per-deposit trips remain).
   - Fix: add these three to the Scope docs list (the 606-607 sentence says the six nodes start at the `base.json` amounts and `depletions` lists them; line 708 row loses amounts) and add `every .amount. is .null.` (or the exact phrase "every `amount` is `null`") to the grep alternation so it finds 6 lines on the tip and 0 after. Also update the "5 lines" count accordingly. Line numbers shift; name by sentence.

## Notes (non-blocking)
- SGS-042's "nothing emits `step-stuck` yet" in the same line 607 sentence is SGS-042's to remove; make sure the 606-607 rewrite does not leave it if SGS-042 has not merged first.
- Everything else (contracts, risk high, dependencies, diagrams, invariants, open questions none, On merge none) was already passed in gate 3 and is unchanged.
