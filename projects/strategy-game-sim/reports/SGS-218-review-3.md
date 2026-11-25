# SGS-218 review 3

Verdict: APPROVE. Tip 2f202a337a9907e318e9bf7cfaddb9aa82bf60b2, base origin/main.

## Blocking findings
None.

## Acceptance criteria
1. Pass. The sorted `components.schemas` keys of `docs/api/openapi.json` (read by node in the scratch) equal the spec's pinned fight names plus `AOE4_SCHEMA_NAMES` including the new entry. The implementer's record shows the base failing at `fight-api-spec-surface.spec.ts:97` with a diff naming `RenameNamedBuildRequest`, and 32 passed at the tip. I ran no acceptance test.
2. Pass. The exact-set assertion is unchanged. The mutation record covers both directions: deleting the entry fails with `+ "RenameNamedBuildRequest"`, adding `'Bogus'` fails with `- "Bogus"`.
3. Pass. `git diff --stat` shows one file with one insertion. `openapi.json` is untouched.
4. Pass. The ticket lists no invariants and no INVARIANTS.md entry applies to the touched path.

## Contract, Bug, conventions, correctness
- The Bug record is present: the regression test fails at the base on the assertion that names the bug.
- The pre-existing test edit (one expected-list entry) is allowed by the ticket Scope.
- The new entry sits in alphabetical order, between `NodeRef` and `ResourceKind`, matching the list's style.
- There are no doc or comment changes and no UI changes, so no UI inspection ran.
- `npx tsc --noEmit && npm run lint:dup` passed with 0 clones.
- There is no review bot, no REVIEW.md, and no applicable invariant.

## Non-blocking notes
None.

## Coverage
Reviewed the full diff, `acceptance/fight-api-spec-surface.spec.ts` lines 25-50, the sorted schema keys of `docs/api/openapi.json`, and the implementer report `SGS-218-implementer-2.md`.
