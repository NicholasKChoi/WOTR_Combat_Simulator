# SGS-081 review 2 (delta): APPROVE

Delta 70aa21a..7eb1d10 on `sgs-081-aoe4-retune-prebuilt-farms`. One commit (`SGS-081 rework 4: correct README farm block
wording`). It touches one file, `data/aoe4-build-order/README.md`: +4/-3 lines.

## Blocking findings

None.

## Rework 4 check

- Knight/longbow entry (`README.md:97-101`): the replacement text matches the Rework 4 sentence word for word, apart
  from line wrapping. It is true against `builds/english-knight-longbow.json` at 7eb1d10. The stables are steps 17, 25
  and 37, so step 37 is the third stable. Steps 38-39 are the `time 634` (10:34) farm pair. Step 40 starts the
  `time 600` block (steps 40-43, `then: farm`). So in the list, the 10:00 block comes after the third stable and after
  the 10:34 pair. The counts for the smaller groups (563: four, steps 31-34; 634: two; 722: one; 942: four) are
  unchanged and still match. "10:34" is a trigger input (634 s), not a simulated instant.
- The spear Farms paragraph (`README.md:80`) no longer has "; it feeds food". `grep "feeds food"` finds nothing.
- The Prebuilt-builds `grep -cE '[0-9]+\.[0-9]+ s'` still prints 0.
- No code, data or test file changed, so the review-1 results for tests, tsc, lint:dup, acceptance and build still
  apply. The JSON is byte-identical to 70aa21a.

## Acceptance criteria

I ticked all of them in the ticket. The README criteria (lines 187 and 192) now pass, because finding 1 is fixed.
Every other criterion passed in review 1 at 70aa21a and is unaffected by this text-only delta. Both Rework 4 required
fixes are ticked.

## Invariants touched

None by this delta (README prose only). A1-A3 hold as recorded in review 1.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty. No bot ran.

## Non-blocking notes

The review-1 notes still stand and were not in scope for Rework 4: the no-op 260 s spear rally, the dropped spear gold
`depletedAt` pin, and line wrapping at `docs/aoe4-build-order.md:968` and `README.md:45`.

## Coverage

Reviewed the full 70aa21a..7eb1d10 diff, and checked the knight JSON step order at 7eb1d10. I re-ran no test suites,
because no code changed.
