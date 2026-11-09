# SGS-101 spec gate, round 1

**Verdict: READY**

## Checks

1. Grounded scope: pass. The three new lib files are marked new. The `saved-builds.ts` names (`savedBuildKey`, `rateCounterKey`, `storageEnv`, `isSavedBuildId`) match SGS-099's Scope and criteria. `ARCHITECTURE.md` has "Where files go" and an "App logic" row. `.gitignore` has no `.builds-local/` yet, and `package.json` has no `@vercel/blob` or `overrides` yet, which is consistent with "add". The zod `^4.6.7` dependency exists.
2. Testable criteria: pass. Each row pins an observable outcome, and the boundary cases are pinned (30 vs 31, `retryAfterSeconds` at 3600, 1 and 1800, exactly 3 `put` calls). The retry-count criterion guards against a loop of 2 or 4. The default-change rule for existing tests does not apply, since nothing calls the new code.
3. Open questions: none in the ticket or CONTEXT.md.
4. Invariants: S3 and A3 are named and the criteria do not contradict them. `nowMs` is an argument, and the limit reads no environment variable.
5. Contracts: matches design C2 and C5 (signatures, the `bumpCounter` semantics, `buildStoreFromEnv` memoization, the file store sync read-modify-write, the `wx` put). The ticket adds `access: 'private'` to the counter `get`, which the design omits. The ticket tells the implementer to record any mismatch with the installed types.
6. Dependencies and size: depends on SGS-099 (stated). About 280 LOC.
7. Diagrams: a flowchart is present (the triggers do not fire, but it helps).
8. Lessons: the one repo lesson (Playwright layout) is not relevant.
9. Decisions: the 2026-11-09 re-spec settled the zod override, file store atomicity and memoization, and the body agrees with design C2.
10. On merge: none. No new command, harness or design doc, so this is fine.
11. Risk: high. The compare-and-swap counter bounds the save path, and the Blob error behavior is unverified. No `criticalPaths` entry applies. The stated rationale holds.
12. Docs: `ARCHITECTURE.md` is in Scope. The README, `docs/` and `ARCHITECTURE.md` have no existing `process.env`, `.env` or Blob statements that go stale (checked by grep). Scope also tells the implementer to grep again.
13. Input validation: the stored counter is parsed as `{ windowStart, count }`, two flat fields, so a hand check is under the threshold. Stored builds are validated by the later route.

## Notes (non-blocking)

- The "exports exactly" criterion is a closed export list. It is pinned by the design's contract names, so it is acceptable. If it goes stale, rewrite it as "exports every C2/C5 name and nothing that imports react, next or node-only modules outside `build-store.ts`".
- The ticket says "Dependencies: `npm audit` reports no advisory for `zod`". This depends on the advisory database at run time. If `npm audit` flags something unrelated, the implementer should record it rather than block.
- The `git status` is clean after `npm test` criterion depends on tests using `os.tmpdir()`. It is stated, so fine.
- The `buildStoreFromEnv` default-directory row says to assert on a mocked `createFileBuildStore` path or a temp working directory. Both are acceptable, but mocking a function in the same module needs care (module-internal calls are not intercepted by `vi.mock`). The temp-cwd option is the safer one.
