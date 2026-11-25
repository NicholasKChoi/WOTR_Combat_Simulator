# SGS-218 acceptance-test report

- Branch `sgs-218-fight-api-spec-pinned-schemas`, tip `2f202a337a9907e318e9bf7cfaddb9aa82bf60b2` (no new commit; I wrote no tests).
- Verdict: PASS.

## Tests written
None. The only diff is one entry in `AOE4_SCHEMA_NAMES` in `acceptance/fight-api-spec-surface.spec.ts`. That spec's test "has exactly the pinned fight and AoE4 schema names and no others" already covers every ticket criterion through the spec file boundary (exact-set check over `components.schemas`), so there was nothing left uncovered.

## Run
- Harness provisioned in scratch (`link-node-modules.sh .`, `npm run acceptance:setup`).
- `npx playwright test acceptance/fight-api-spec-surface.spec.ts` at the tip: 32 passed (3.6 s), including the target test.
- `docs/api/openapi.json` is unchanged (`git diff origin/main...HEAD --stat`: only the spec file, 1 insertion).
- Lint: I wrote no files; the implementer's `tsc --noEmit && lint:dup` pass stands.

## Mutation checks (scratch `mutate-SGS-218`, run against the target test with `-g`)
1. `acceptance/fight-api-spec-surface.spec.ts` `AOE4_SCHEMA_NAMES` entry `'RenameNamedBuildRequest'` deleted (reproduces the base): failed with `+ "RenameNamedBuildRequest"` in the received set. Reset with `git checkout --`, `git diff --exit-code` clean.
2. `docs/api/openapi.json:5956` schema key renamed to `RenameNamedBuildRequestDropped` (a schema removed or renamed in the spec): failed with `- "RenameNamedBuildRequest"` / `+ "RenameNamedBuildRequestDropped"`. Reset, clean. Alternative substituted: a rename, since a pure removal would leave a dangling `$ref`; the missing-name side of the check is still the assertion that failed.
3. `docs/api/openapi.json` added unpinned schema `UnpinnedExtra` before line 5956 (drift the other way): failed with `+ "UnpinnedExtra"`. Reset, clean.

All three failed on the target assertion `toEqual(expected)`. The ticket states no choice other than the exact set.
- Checks ran in `mutate-SGS-218`; scratch removed.
- `tree-record.sh` on the task checkout before and after: both `hash 6d9b3f285ef4cb73bf050b5c44bc358bfe4a646f`, empty status listing; they match.

## Failures
None.

## Criteria not expressible
None.
