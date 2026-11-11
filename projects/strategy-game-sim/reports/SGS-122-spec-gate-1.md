# SGS-122 spec gate, round 1

**Verdict: READY**

## What was checked

- Read at origin/main: `saved-build-loader.ts`, `save-build-client.ts` and their tests. `loadSavedBuild`, `postSavedBuild` and `readJson` exist as the ticket describes. The only `readJson` user is `postSavedBuild`, and `postSavedBuild` is called only from `save-build.tsx`.
- `build-fetch.ts` and `named-build-client.ts` are marked new. `design/M8.md` C4 and C4a match the ticket's signatures, status tables and message mapping.
- Names from SGS-119 (`NamedBuild`, `CreateNamedBuildResponse`, `UpdateNamedBuildResponse`, `isNamedBuildId`, `NAMED_BUILD_ID_PATTERN`, `storedNamedBuildSchema`, `revisionEtag`) are all in SGS-119's scope. SGS-119 is in the Depends-on field and in the TASK-GRAPH row. `savedBuildSchema` is a plain `z.object` (zod ^4.6.7), so `.extend`, `.omit` and `.extend` chain without trouble.
- Existing `save-build-client.test.ts` asserts only url, method, body and signal for the POST, not the header shape. Moving to `sendJson` therefore cannot break it, and "no edits to expected values" is achievable.
- Criteria are observable. The end-state greps (`fetch(` absent from the three client files, `readJson` absent) hold under Scope. No stale counts or lists are pinned. The behavior is unchanged, so there is no existing-test rule to state.
- CONTEXT.md Open questions and Decisions are empty, and the ticket has no open questions. `On merge: none` is valid. No LESSONS entry applies. The Playwright and CSS-proxy lessons do not touch this ticket.
- Risk `standard` is right: no criticalPaths symbol changes and no strongModelTriggers item. The design gives every name exactly.
- Size is about 120 lines. No diagram trigger applies. No doc describes these modules (the ticket says so). There is no new trust-boundary input beyond the module-local response checks: the create response has 5 flat fields, and the 200-body parse uses zod.

## Gaps

None.

## Notes (non-blocking)

1. Criterion on `loadSavedBuild` (line 91) lists three outcomes to keep: invalid id with no request, the parsed record, a record of another version. The existing "requests the build with the given signal" case (URL plus signal) is a mapping-specific URL check and is not listed. It could be read as moved to `build-fetch.test.ts`. Suggest adding "the request URL and signal" to the kept list, so the `/builds/<id>` path stays pinned.
2. "Module-local check" of the response fields is unspecified in strictness (for example whether `revision` must equal `1` for create, or just be a number). The criteria only pin a missing `editSecret`, so either choice passes. Suggest the ticket say "string `id`, `path`, `editSecret`, `updatedAt` and `revision` equal to 1 (create) or an integer (update)".
3. `createNamedBuild` and `updateNamedBuild` share the failure mapping. With jscpd at threshold 0, the implementer should write the mapping once (one local function). This is implied by the lint:dup criterion, so no change is needed.
4. A 428 (If-Match missing) reply maps to `other` with the generic text. That is consistent with the table and acceptable.
