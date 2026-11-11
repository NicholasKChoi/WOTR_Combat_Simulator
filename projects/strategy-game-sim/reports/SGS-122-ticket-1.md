# SGS-122 ticket report 1 (re-spec)

- Ticket: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-122-named-build-client-shared-fetch.md`
- Mode: re-spec 1. Lint: clean.
- Verdict: spec fixed and ready for implementation. Branch `sgs-122-named-build-client` at `e137e688b7e701d3696c22a5cc7442f4d49bc9cd` already matches the new end state, so no code change is needed. It can go straight to review.

## Decision: strip, not strict
`namedBuildBodySchema` stays in zod's default strip mode. If a body still carries `secretHash`, the load returns `ok` and the `build` it returns has no `secretHash` key.

Evidence:
- Keeping `secretHash` out of the GET body is the server's job: `design/M8.md` C1 GET row 6 ("all stored fields but `secretHash`, plus `id`"); the `NamedBuild` OpenAPI schema is closed with `unevaluatedProperties: false`; and the M8.1 server acceptance specs check that no `secretHash` is returned and run ajv against the OpenAPI schema. A leak is a server bug, and those tests catch it.
- C4 only says the client "validates the body against the `NamedBuild` shape". It does not ask the client to detect leaks. Returning `failed` would not take back a hash that was already sent. It would only stop the user opening their build.
- Stripping means a leaked key never reaches page state or `my-builds-storage.ts`, and the returned value matches the `NamedBuild` type ("never has `secretHash`").
- No client schema under `lib/aoe4-build-order` or `components/apps/aoe4-build-order` uses `.strict()` or `.passthrough()` on origin/main, so `savedBuildSchema` strips too. Stripping here is consistent with that.
- Tradeoffs, written into Scope: the client will not notice a leaking server, and it silently drops any field a later server adds until this schema names that field.
- This is not marked `owner` because the design and its tests settle it.
- The prompt calls S1 the secrecy invariant, but INVARIANTS.md S1 is "Apps are independent". No invariant covers secrecy; the rule lives in design C1 and the server tests.

## Changes
- **Scope:** adds the strip-mode rule, the reasoning and the tradeoff. Accepts `fetch-test-helpers.ts` (`stubFetch`, `lastCall`, `reply`; test-only; exists because jscpd at threshold 0 flags the stub when it is copied into two files).
- **Criteria tagged `(respec 1)`:**
  - The `loadNamedBuild` criterion now expects `ok` with no `secretHash` key, checked with `toStrictEqual`. A `.passthrough()` mutation must fail that case. It also keeps the existing `failed` cases for a missing `revision` and a non-named id.
  - The `loadJson` request criterion now says the stub is defined once in `fetch-test-helpers.ts` and no production module imports it.
- **History:** appended `## Re-spec 1 - 2026-11-10`.

## Checks run
- Mutation: in a throwaway detached worktree at e137e68, I added `.passthrough()` to `namedBuildBodySchema` and ran `npx vitest run components/apps/aoe4-build-order/named-build-client.test.ts`. "drops a secretHash the body still carries" failed (1 failed, 24 passed). The worktree was removed afterwards.
- `git grep fetch-test-helpers e137e68`: only `build-fetch.test.ts` and `named-build-client.test.ts` import it.
- The existing grep criteria (no `fetch(` in the three client files, no `readJson` in components) are unaffected; the helper is not in their paths.

## Diagrams
None. Single component, so the "no diagram required" line stays.

## Open questions
none

## Overlap
None new. The C8 Save panel rewrite still deletes `postSavedBuild` and `isSaveBuildResponse`, unchanged.
