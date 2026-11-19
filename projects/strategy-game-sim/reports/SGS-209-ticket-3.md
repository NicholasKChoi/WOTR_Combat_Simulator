# SGS-209 ticket 3 (re-spec 1)

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-209-rename-api-patch-named-builds.md
Read at origin/main d80751bec267e9358dc9d45742272f5e5e5917c9. ticket-lint (with --spec): no errors, no warnings.

## Summary

SGS-209 "Add PATCH named-builds/{id} to rename a named build, with the rename client", component aoe4-build-order, Feature, M12, risk standard, ~110 LOC, Depends on none. Covers the PATCH route (check order, body rule, write, CAS 412), the `renameNamedBuild` client, `patchNamedBuild` helper, OpenAPI 2.7.0, docs, and the rename acceptance spec. No diagrams (single component, outside the core control loop).

## Gate findings folded in (spec-gate-2)

1. Existing-tests rule: replaced with a rule keyed on the id route's `Allow` list or 405 message, or on `PATCH` being disallowed there; those tests take the new values and probe with a method that stays disallowed (`POST`). Examples named: the `PATCH` 405 table and "answers 405 for DELETE in %s" (`Allow: 'GET, PUT'`, `use GET or PUT`) in `lib/aoe4-build-order/named-builds-routes.test.ts`; "PATCH gives 405" in `acceptance/aoe4-named-builds-api.spec.ts`; "the 405 examples" in `acceptance/aoe4-named-builds-api-contract.spec.ts` (`request.patch` probe, `patchOnId` key). OpenAPI's id-path 405 examples (today `patchOnId` on get/put/delete) become a `POST` probe with a matching key (for example `postOnId`), on the new operation too. Contract-spec structure assertions may gain the rename operation; their assertions on existing operations stay. Criterion rewritten (respec 1).
2. Format doc: Scope now lists each statement that becomes untrue in "Named builds routes" (intro naming GET/PUT/DELETE, the update bullet's "may rename the build", the write-budget bullet, the production-405 bullet) and requires the section to state the rename's check order and write (name rule only, no catalog validation or saved-record size check; writes only name, revision, `updatedAt`). Doc criterion extended (respec 1).

Also found while re-exploring: the OpenAPI 429 descriptions on `updateNamedBuild` and another named-builds operation say "saveBuild, createNamedBuild and updateNamedBuild share the budget"; Scope now has them name `renameNamedBuild`.

## Non-blocking notes, decided

- `renameNamedBuild` unit tests are now unconditional, in `components/apps/aoe4-build-order/named-build-client.test.ts` following its `updateNamedBuild` tests; the client criterion says so.
- 413: the PATCH operation documents the same status set as `updateNamedBuild`, 413 included, because the `[id].ts` `bodyParser` `sizeLimit: '128kb'` rejects oversized bodies for any method. The route itself never gives 413 for a rename, so the PATCH 413 response describes only the framework's plain-text reply, with no JSON content or example (the examples-validate test skips responses without JSON content).

## Open questions

none

## Overlap

None new. The `info.version` 2.7.0 bump is shared with the repeat-step ticket as before (identical change, no dependency).

## Re-spec section

`## Re-spec 1 - 2026-11-18` appended; changed criteria and Scope bullets tagged `(respec 1)`.
