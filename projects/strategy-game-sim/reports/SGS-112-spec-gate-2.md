# SGS-112 spec-readiness gate, round 2

Read at `origin/main` (b3da879) after `git fetch origin`. No Depends-on. Re-read: api-route.ts, builds-routes.ts, save-rate-limit.ts, build-store.ts, blob-build-store.ts, saved-builds.ts, the three page routes, playwright.config.ts, build-store.acceptance.test.ts, acceptance/aoe4-builds-api-contract.spec.ts, ARCHITECTURE.md, docs/aoe4-build-order.md, design/M8.md C2/C3, plus the two `recordingTarget` copies and `@next/env`.

## Verdict: READY

All three round-1 gaps are closed: the contract-spec edit (key list line 42, example test line 182) is in Scope and criteria; the export-list rule names `build-store.acceptance.test.ts` and `nextCounter`; the docs 500 row and Builds-routes bullets are in Scope, with `500` added to the grep terms. The notes from round 1 are also adopted (`deploymentEnv` rows in `saved-builds.test.ts`, inline `SavedBuild & { id: string }`, explicit `sendReply<Union>` allowed).

Per check:
1. Grounded: every named file, function and test exists at origin/main or is declared new (`route-test-support.ts`, `idFailure`, `deploymentEnv`, `issuesError`, `nextCounter` export).
2. Testable: each criterion has an observable outcome. The grep criteria hold in the end state: `MAX_REPORTED_ISSUES` outside tests is only in `api.ts`, `saved-builds.ts` (import and slice both go) and `simulate.ts`; `count + 1` only in `build-store.ts` and `blob-build-store.ts` today. The `build-store.acceptance.test.ts` `takeSaveSlot` case (30 allowed, 31st refused) still holds.
3. Open questions: none; CONTEXT.md has none.
4. Invariants: S3 named; no criterion contradicts it.
5. Contracts: C2 and C3 of design/M8.md match the Scope signatures and sample rows word for word.
6. Size: about 200 LOC estimate, mostly tests.
7. Diagram: present, read/act/record, matches the new order.
8. Lessons: none predicts a failure here.
9. Decisions: CONTEXT.md Decisions is empty; the body agrees with the design.
10. On merge: `none`, valid.
11. Risk: `high` is right (`bumpCounter` signature, `RouteReply`/`ReplyTarget`/`sendReply` contracts, new 500 on a public API).
12. Docs: ARCHITECTURE rows 24-25, `docs/aoe4-build-order.md` lines 718-720 and the table at 1045-1050, and the OpenAPI/contract spec are all in Scope. The contract spec's "still counts against the rate limit" prose stays true.
13. Input validation: no new input at a trust boundary.

## Notes (non-blocking)

- `recordingTarget` has two different shapes today. `api-route.test.ts:38` returns `{ target, calls }`, while `builds-routes.test.ts:239` returns the bare spy object and its callers cast `as unknown as ReplyTarget`. "Moved unchanged" is ambiguous; the sensible reading is the api-route shape, with the builds-routes DELETE tests destructuring `{ target }` and dropping the cast. Say so in the ticket if you want zero guessing.
- The Playwright docs step: `environment-variables.md` (line 266, "Environment Variable Load Order") says lookup stops at the first place found, and `process.env` is listed first. It may not name the empty-string case. `@next/env` does confirm it: `processEnv` only takes a `.env` value when `typeof initialEnv[key] === 'undefined'`, and `replaceProcessEnv` restores empty strings from the initial env. If the docs only support "process.env first", the implementer should quote that passage and cite the `@next/env` behaviour, not stop.
- `errorReply` has no stated return type. Typing it `RouteReply<BuildsError>` lets it fit each handler's response union.
