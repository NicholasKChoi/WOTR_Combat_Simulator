# SGS-156 spec gate 4 (after re-spec 5)

Verdict: READY

Scope: re-spec 4 and 5 changes (Scope 10 and its criterion). Scope 1-9 and their criteria were gated READY in gate 3 and are unchanged except for the added text.

## Checks on the new Scope 10

- Grounded: `MAX_FLOATING_AT_1200 = 2000` exists in `lib/aoe4-build-order/production-floors.ts` at origin/main. It is the one constant used by `productionChecks`, which both `lib/aoe4-build-order/builds.test.ts` (the named test exists) and `acceptance/aoe4-simulate-api-prebuilt-farms.spec.ts` (test "meets its production floors and floating cap at 1200 s") call. `production-floors.test.ts` imports the constant by name and quotes no value, so it needs no edit.
- Testable: the value 2600 is an owner decision (Q98), so a pinned number is allowed. The bound is the observable check in both test files. The stop rule (measured value above 2600 means needs_spec, no higher number picked) is explicit. The implementer's measurements are 2511.69 (ENG 1TC) and 2219.55 (ENG 1TC Council Hall), both below 2600, and the other two builds passed under 2000. The "about 2512 and 2220" figures are evidence in prose, not a criterion.
- Docs: `docs/aoe4-build-order.md` (Prebuilt builds paragraph, "that file's cap") and `data/aoe4-build-order/README.md` (`## Prebuilt builds`, "a floating cap ... set in production-floors.ts") quote no value today, so the rule "add none that quotes the number" is consistent with the end state. The criterion "No doc states the old cap value" holds at base and after.
- Open questions: none; the cap question is removed.
- Risk and invariants: unchanged. Risk stays high (A2/A3 paths touched), and raising a test cap contradicts no invariant.

## Notes (non-blocking)

- `data/aoe4-build-order/README.md` lines near 84 and 119 say the wood or economy "goes into" units "instead of floating". Under the new engine, ENG 1TC and ENG 1TC Council Hall float about 2.2-2.5k wood at 1200 s, so those sentences are slightly softer than the run shows. Scope 10 already tells the implementer to grep docs for statements of the cap's reasoning; the implementer should reread those two lines and reword only if they claim no wood floats.
- The README line "a build that starves its production or leaves its economy unspent fails" stays true at the higher cap; no change is required.
- The branch (tip ff47225) has the engine, docs and pinned-test updates; only the constant, plus any doc text found by the grep, remains.

## Gaps

none
