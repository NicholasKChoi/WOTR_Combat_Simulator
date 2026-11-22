# SGS-213 implementer 7 (rework 1)

- Ticket SGS-213, branch `sgs-213-step-popover-beside-text`, tip f1bf9afd40d4a9909d875cc501089ac68dae1e74 (parent 1e46dd41), checkout `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-213-step-popover-beside-text`.
- Checkout.sh task was not re-run: the checkout existed, had no `origin/<branch>` ref (the own-commit check is skipped by rule), tip was 1e46dd41 and the tree clean.

## Files touched
- `components/apps/aoe4-build-order/annotation-popover.test.ts`: the five position `it` blocks became one `it.each<[string, Partial<PlacementRects>, { left?: number; top?: number }]>` table checked with `toMatchObject`; same names, overrides and expected values; first three blocks untouched.
- Ticket: Rework 1 checklist box ticked.

## Tests
- `annotation-popover.test.ts`: 10 passed. Full `npm test`: 3116 passed, 15 skipped, 0 failed.
- No acceptance spec added or edited. No pre-existing test assertion changed (rows keep the same inputs and expectations).
- No doc claims added or changed. No pinned outputs. Not a new Bug fix (rework of test layout only).

## Mutation checks
Ran in scratch `mutate-sgs-213` (provisioned with link-node-modules.sh; no codegen or acceptanceSetup set/needed). Task checkout state before and after: status ` M components/apps/aoe4-build-order/annotation-popover.test.ts`, tracked-diff hash 5a68b2aa03bb300176f034ff79fd07c6a93f039d, identical. Each break reset with `git checkout --` and `git diff --exit-code` before the next; scratch removed.
1. `annotation-popover.tsx:29` beside top unclamped (`top: anchor.top`): fails "clamps a beside placement vertically when the anchor is near the viewport bottom" and "...above the viewport top margin".
2. `:31` fallback always below (`const top = below`, rejected alternative to below-else-above): fails "puts a fallback popover above the anchor when it does not fit below" and "clamps a fallback popover to the top margin...".
3. `:32` fallback left unclamped (`left: anchor.left`): fails "keeps a fallback popover inside the viewport when the anchor is near the right edge".
4. `:32` fallback top clamp removed (`top`): fails "clamps a fallback popover to the top margin when it fits neither below nor above the anchor".
Every one of the five rows fails under at least one break.

## Clean
- `npx tsc --noEmit`, `npm run lint:dup`: clean. `npx next build`: succeeded. Codegen not set.
- Diff stat: one file, 24 insertions, 22 deletions.

## Invariants
A1-A3 not touched (test-only change).

## Unverified assumptions added
None.

## Out-of-scope findings
None.

Status: needs_review
