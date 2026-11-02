# SGS-041 acceptance-test 1

Verdict: PASS. Tip tested 0695d47; new commit c56a5f6 (test only) on sgs-041-aoe4-research-multitier-note-severity.

## Comparison against origin/main 9137cf2 (two next dev servers, same POST bodies)
- prebuilt English 1TC + textiles/wheelbarrow/fertilization/veteran-spearmen: every field other than `notes` byte-identical; notes identical except message wording (display name -> baseId) and `severity: 'info'`.
- textiles-only order (age-gated, never starts): identical, same note delta.
- english 1TC + late time-triggered wheelbarrow (500s) and textiles (520s): identical timings, same note delta.
- english 1TC + bloomery/admiralty/textiles: identical, same note delta.
- All notes: every one `info`, message starts with `<tech>: `.

## Tests written (acceptance/aoe4-simulate-api-research.spec.ts), 3, all pass
- every note is info and its message names the tech by id (exact bloomery and admiralty messages).
- research of textiles (only entry age 2) at age 1: waits, startedAt null, floating series equal to the same order without the step (nothing paid or reserved).
- same tech after the age-up build: completes with startedAt >= age-2 reachedAt (not stuck).
Ran with existing aoe4 simulate specs (timelines, contract, edges, api, depletion): 145 passed. `npx tsc --noEmit` and `lint:dup` clean.

## Mutation checks (each reverted with git checkout, tree clean)
- drop `entry.age <= state.age` in researchEntry: waits-at-age-1 test failed.
- `<` instead of `<=`: starts-once-age-reached test failed.
- first note severity 'error': notes test failed.
- entry.name in either note message: notes test failed.

## Notes
- The shipped snapshot has no multi-tier tech (0 baseIds with >1 entry among 69 technologies and 11 upgrades). The multi-tier paths (highest tier at age, higher tier after waiting, researchedIds vs sibling effects, resolveUnitEntry tier) are only coverable via the existing editGameData unit tests in research.test.ts; not expressible through the API. Age gating is exercised through the real single-entry age-2 tech textiles.
- A waiting research step blocks later steps (sequential), so an age-gated step before the age-up step deadlocks; that is SGS-042's stuck handling, not this ticket.
- Ticket criteria were already ticked; none changed.
