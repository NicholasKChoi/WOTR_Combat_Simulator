# SGS-189 implementer report 1

Ticket SGS-189, branch `sgs-189-reorder-builds`, tip `b17652dd8bef709f3a6e7d049ff6b50ee28b629d` (base origin/main 87f0cd7), checkout `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-189-reorder-builds`.

## Files touched
- `data/aoe4-build-order/builds/english-knight-longbow.json`: steps reordered per ticket (74 steps).
- `data/aoe4-build-order/builds/english-1tc-council-hall.json`: steps reordered per ticket (61 steps).
- `data/aoe4-build-order/README.md`: Council Hall "Added after the guide" paragraph rewritten to the new order; reorder named as a transcription choice. Knight/Longbow entry unchanged (every placement sentence read against the new file holds: four blacksmith techs after `build kings-palace` (idx 29,35,42,45); `veteran-longbowmen` and Castle techs after `produce knight` (idx 46); 10:00 farm block after the third stable and the 10:34 pair).
- `lib/aoe4-build-order/research.acceptance.test.ts`: re-pinned the Knight/Longbow conversion test. This is the only test file edited, and the only test changed.

## Step comparison (base vs branch, script)
Both files: step count equal (74/74, 61/61), multiset of step objects equal, non-step fields equal, and the branch sequence equals base steps indexed by the ticket's order.

## Tests
- `npm test`: 83 files passed, 1 skipped; 2613 passed, 15 skipped, 0 failed. All `builds.test.ts` cases (floors, floating cap, no-waiting bars) pass unchanged.
- Re-pinned test "holds 20 tier-2 longbowmen at the last sample before completion and moves them all to tier 3 at the first sample at or after it" encodes: completion defined; at last sample before completion tier 2 = 20, tier 3 = 0; at first sample at or after it tier 2 = 0, tier 3 = 20; tier 2 = 0 at every later sample; final tier 3 = 71.
- Pinned outputs (engine returns, Knight/Longbow, `durationSeconds: 1800`): `veteran-longbowmen` completes at 838.0186 s; last sample before it t=835: longbowman-2 = 20, longbowman-3 = 0; first sample at or after it t=840: longbowman-2 = 0, longbowman-3 = 20; longbowman-3 at 1800 s = 71 (was 72; the test now reads the last sample rather than literal 1800).
- Pre-existing test edited: `lib/aoe4-build-order/research.acceptance.test.ts` "holds 20 tier-2 longbowmen ..." (assertions re-derived from the completion; the ticket Scope allows exactly this).

## Mutation checks
- `lib/aoe4-build-order/research.ts:73-74` (`convertUnits`: leave one unit unconverted): the new test failed at `expect(lower[after]).toBe(0)` ("expected 1 to be 0"); another test (line 84) also failed. Restored.
- `research.ts:58` (added `convertUnits(state, entry)` at payment, converting at start): the new test failed at `expect(lower[before]).toBe(20)` ("expected 5 to be 20"). Restored.
Both breaks were undone (file restored from backup; `git status` shows only the intended four files).

## Doc claims
- README: "the order of the added blacksmith techs against the farms is chosen so the build keeps its production floors and floating-resource cap." True: `builds.test.ts` floor and cap cases pass on the reordered file (`npm test` above).
- README order sentences describe indices 31-60 of the new Council Hall file (checked by listing steps).

## Codegen, build, lint
- codegen: not set. `npx next build`: passes. `npx tsc --noEmit && npm run lint:dup`: 0 errors, 0 clones.
- Acceptance specs (Playwright) were not run: the ticket's harness is owned by the separate acceptance gate, and this task does not change the harness. Not reproduced here.

## Invariants
A3: no code changed; reorder is static data, simulation deterministic (tests pass on repeat). A1/A2: untouched.

## Unverified assumptions added
None.

## Out-of-scope findings
None.

## Status
needs_review
