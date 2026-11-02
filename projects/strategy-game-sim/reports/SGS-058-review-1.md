# SGS-058 review 1: REQUEST CHANGES (tip 82f2832)

Blocking
- lib/aoe4-build-order/data-schema.ts overlayEffectSchema `source: z.string()` - test/contract - coverage lost. The removed
  "labels every value with a source" test walked every object with a `value` key, which includes the english.json effects
  (they carry value, source, unverified). It required a non-empty source on each. The schema accepts `source: ''` on an effect
  (verified: structuredClone of english.json with effects[0].source='' passes civRulesFileSchema.safeParse). Direction: use
  `text` for the overlay effect source. Add a defect row for it (an empty overlay-effect source) so it cannot regress.
  (unverified missing on an effect is rejected; fine.)

Verified
- 8 defect tests: weakening one schema rule each (regex, startsWith, min(1), unverified optional, number->any, record->partialRecord,
  grantedBy optional, type enum->string) failed exactly the matching test only; file restored.
- Exactly 3 `z.ZodType<` lines (54, 74, 89); no importer outside the file and tests; imports are `import type` from ./data and a
  value import of GATHER_NODES, RESOURCE_KINDS from ./model; no json/fs. Removed-pattern grep prints nothing.
- tsc passes; lint:dup runs clean; data.test.ts 36 tests pass (run on Node 22 for unit tests; acceptance not rerun, implementer reports 569 pass).
- Other coverage: trip, builderScaling, amount, startingState, supply and upgradeTargets hand values all go through handValue, so covered.
- Removed assertions match the implementer's list; handValues counts and other tests unchanged.

Non-blocking: defect rows for empty source and missing unverified only exercise base.json; fine given the shared handValue.
