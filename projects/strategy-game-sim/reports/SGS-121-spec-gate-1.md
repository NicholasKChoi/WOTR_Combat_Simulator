# SGS-121 spec-readiness gate, round 1

**Verdict: NEEDS_SPEC** (two small, mechanical gaps; neither needs the owner)

Read: ticket, `design/M8.md` (all), CONTEXT.md, INVARIANTS.md, both LESSONS.md, REPO.md, tickets SGS-112, SGS-119 and SGS-120, and `origin/main` code (`builds-routes.ts`, `pages/api/aoe4-build-order/builds/*`, `docs/api/openapi.json`, `ARCHITECTURE.md`, `docs/aoe4-build-order.md`, the contract specs). None of SGS-112, SGS-119 or SGS-120 has a local branch yet (all `draft`), so their end states were read from their ticket text, not code.

## Gaps

1. **Acceptance criteria, search criterion (check 2): it forbids what Scope adds.**
   - The criterion reads: "every non-test `console.` call in `named-builds-routes.ts` is a call that logs a fixed message and a caught cause".
   - Scope adds `builds: named id collision` (create row 14), which has no caught cause.
   - Scope's stored-schema log passes a zod error, not a caught cause.
   - An implementer must either invent a cause or fail the criterion.
   - Fix: reword to "every non-test `console.` call in `named-builds-routes.ts` logs one of the fixed messages (`builds: named id collision`, `builds: stored build failed its schema`) plus at most the zod error; none passes `req`, `authorization`, a secret, a hash or a stored record". `idFailure` and `storageUnavailable` log from `builds-routes.ts`.

2. **Acceptance criteria, contract spec (check 2): closed lists that go stale.**
   - "the paths are exactly the six", "the operationIds are the four named in Scope plus the three existing ones" and "the closed ones are `CreateNamedBuildResponse`, `UpdateNamedBuildResponse` and `NamedBuild`" each pin a closed list.
   - Any later route or schema, for example the per-version history in the design's extension points, breaks them.
   - Fix: replace them with properties:
     - the path set equals the set of route files under `pages/api/`, mapped to `/api/...`;
     - operationIds are unique and non-empty;
     - the four named operations exist with exactly the statuses in Scope;
     - each of the three new schemas is closed, has every property described, and has the named property set (no `secretHash` on `NamedBuild`).
   - Keep the version pin `2.5.0`, which is a design constant.
   - The Scope sentence that moves `aoe4-builds-api-contract.spec.ts` to "six paths" should read the same way, so it does not hand-list again.

## Checks that passed

- **Grounded scope (1).** `saveBuildReply`, `savedBuildReply`, the `builds/index.ts` and `[id].ts` adapters, `docs/api/openapi.json` and the three specs pinning `2.4.0` (`aoe4-builds-api-contract`, `aoe4-gathered-resources`, `aoe4-simulate-api-issue-shape`) exist on `origin/main`.
  - `SavedBuildWithId` already composes an open `SavedBuild` with `id`, so `NamedBuild` via `allOf` plus `unevaluatedProperties: false` has a precedent.
  - `StoreGetter` is a non-exported type on main. SGS-112 does not export it, and the ticket says to export it in place rather than redeclare it.
- **Open questions and decisions (3, 9).** The ticket's Open questions are `none`. CONTEXT.md has none. The design's Owner decisions (shared budget, no production delete) are reflected in the ticket body.
- **Invariants (4).** S3 is named. A3 is not touched.
- **Contracts and dependencies (5, 6).** Names, statuses and texts match design C1, C2 and C3 row for row. SGS-112 provides `errorReply`, `storageUnavailable`, `idFailure`, `deploymentEnv` and the typed replies. SGS-120 provides `createNamed`, `getNamed`, `replaceNamed` and `deleteNamed`. SGS-119 provides the C1 library. The dependency list is complete. About 220 lines of business logic is under the 400 limit.
- **Diagrams (7).** A diagram is present and agrees with the update order.
- **Lessons (8).** No entry applies. The ticket already handles the "Error stringifies to {}" log pitfall through the marker-in-message criterion.
- **On merge (10).** It is one `;`-free item naming the CONTEXT.md Key surfaces. The ticket adds no command, harness or design doc.
- **Risk (11).** `high` is right: order of operations, mutable shared state and new public auth.
- **Input validation (13).** Request body validation is the existing `checkSaveBuildRequest`. Header parsers come from SGS-119. No new hand-rolled validator.
- **Docs (12).** `ARCHITECTURE.md` and the `docs/aoe4-build-order.md` "Builds routes" section are in Scope with a grep rule. The existing `saveBuild` OpenAPI prose ("rate limit, per client") stays true under the shared budget (see note 3).

## Notes (non-blocking)

1. Add one line saying GET and DELETE never take a rate-limit slot. The 7-row table and diagram imply it, but "one slot per write" in the Invariants line could tempt an implementer to charge DELETE.
2. The live acceptance spec's 30-write budget test needs its own `x-forwarded-for` client, separate from the main flow's client. The main flow's creates, PUTs and 403, 412 and 404 PUTs all cost slots. Say so in the spec so the two do not share a counter.
3. `saveBuild`'s existing 429 text ("This client saved too often") is not wrong under the shared budget. "No other existing operation changes" is therefore consistent. If the owner wants it to mention named writes, that is a description-only edit to allow explicitly.
4. SGS-112, SGS-119 and SGS-120 are not integrated and have no local branches. The implementer's "read their local branch tips" step needs those tasks to be built first. This is ordering, not a ticket defect.
