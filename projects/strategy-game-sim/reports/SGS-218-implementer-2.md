# SGS-218 implementer report

- Ticket SGS-218, branch `sgs-218-fight-api-spec-pinned-schemas`, tip `2f202a337a9907e318e9bf7cfaddb9aa82bf60b2`, base `7d7480049b42888097d9344c92fb3a52e19a07f7` (origin/main).
- Checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-218-fight-api-spec-pinned-schemas`
- Status: needs_review

## Files touched
- `acceptance/fight-api-spec-surface.spec.ts`: added `'RenameNamedBuildRequest'` to `AOE4_SCHEMA_NAMES` (alphabetical, after `NodeRef`). One line. `docs/api/openapi.json` unchanged.

## Tests
- Acceptance spec edited: `acceptance/fight-api-spec-surface.spec.ts`. Setup: `link-node-modules.sh . && npm run acceptance:setup`. Command: `npx playwright test acceptance/fight-api-spec-surface.spec.ts`. Result: 32 passed.
- `npm test`: 95 files passed, 1 skipped; 3116 tests passed, 15 skipped.
- Invariant encoded: the exact-set assertion over `components.schemas` (unchanged) now matches the current spec.

## Pre-existing tests edited
- `fight-api-spec-surface.spec.ts` "has exactly the pinned fight and AoE4 schema names and no others": one expected-list entry added; the assertion is unchanged. Allowed by the ticket Scope.

## Doc claims
None added or changed. No comments added.

## Bug regression at base
- Scratch `regress-SGS-218` at base `7d74800`. The regression test is the same spec test; at base it fails. Command: `npx playwright test acceptance/fight-api-spec-surface.spec.ts -g 'exactly the pinned'`. Failed at `fight-api-spec-surface.spec.ts:97` `expect(Object.keys(schemas).sort()).toEqual(expected)`, diff `+ "RenameNamedBuildRequest"`. Scratch removed.

## Mutation checks
Run in `mutate-SGS-218` scratch (branch tip), provisioned with `link-node-modules.sh .` and `npm run acceptance:setup`. No codegen set.
- `acceptance/fight-api-spec-surface.spec.ts:38`, deleted the new entry (this reproduces the base): the test failed with diff `+ "RenameNamedBuildRequest"`. Reset with `git checkout --`, `git diff --exit-code` clean.
- Same file, added an unpinned `'Bogus'` entry after `'Severity'` (drift in the other direction): the test failed with diff `- "Bogus"`. Reset, clean.
- `tree-record.sh` of the task checkout before the scratch and after removing it: both `hash 6d9b3f285ef4cb73bf050b5c44bc358bfe4a646f`, empty status listing (work was committed); they match.
- The ticket states no choice other than the exact set, which is unchanged.

## Codegen, build, lint
- codegen: not set. `npx next build`: passed. `npx tsc --noEmit && npm run lint:dup`: passed, 0 clones.
- `git diff --stat origin/main`: only the spec file, 1 insertion.

## Invariant check
No INVARIANTS.md entry touched (ticket: none).

## Unverified assumptions added
None.

## Out-of-scope findings
None.
