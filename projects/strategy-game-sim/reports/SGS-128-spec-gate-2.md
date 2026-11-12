# SGS-128 spec gate 2

**Verdict: READY**

Checked at `origin/main` (cdc51b1) after `git fetch origin`. All six gaps from gate 1 are closed. I found no new blocking gap.

## Gate 1 gaps

1. Probe: closed. It now pastes the body of `fakeStorage` from `storage-test-helpers.ts` into a test file. That helper file is in the tests-config pattern, so it is the clone partner. The probe can fail.
2. Size and split: closed. The estimate is ~500 lines of test code and config, stated as one unit, with the reason: C13 gives both configs the same `path`, so the gates cannot be split. The per-clone placement is listed.
3. Invariant S1: closed. S1 is in `Invariants`. Scope gives placement rules for WOTR-only, AoE4-only and cross-app clones. The cross-app folded function takes data as arguments and imports from no app directory. Criteria repeat this.
4. Fetch helper rule: closed. A local helper is removed only when a `fetch-test-helpers.ts` export, called with arguments, gives the same requests and responses. `auto-run.test.ts` is named as a keeper. The report lists each local helper kept, and the criterion holds at the base. `git grep` finds only `saved-build-loader.test.ts` and `simulate-client.test.ts` for `function stubFetch` and `stubGlobal('fetch'`.
5. `throwingStorage` and `fakeStorage` members: closed. Every `Storage` member is named, and a helper test table covers them.
6. Call-site seeding: closed. Seeding goes through `fakeStorage({ [KEY]: raw })`. The missing `removeItem` in the `chart-layout` copy is addressed. I checked the call sites (`fakeStorage(raw)`, `fakeStorage(stored(...))`, and the partial storages at `my-builds-storage.test.ts` lines 124 and 150-151).

## Other checks

- **Grounded scope:** `lib/aoe4-build-order/route-test-support.ts`, `acceptance/helpers.ts` and `acceptance/openapi-schemas.ts` exist. `storage-test-helpers.ts` and `.jscpd.tests.json` are marked new. The three storage copies and two fetch copies are as the ticket describes. The ARCHITECTURE.md rule is at lines 46-48. `lint:dup` and jscpd are mentioned only in `package.json` and ARCHITECTURE.md.
- **Criteria:** none pins a count or a current name. The "19" and "9" counts appear only as Context measurements. The grep criteria hold at the base and after the change.
- **Risk:** `standard` is right, since no production code or critical path changes.
- **On merge, Open questions, Diagrams, Unverified assumptions:** all fine. Gate 1 confirmed the jscpd `pattern` behavior by running it.
- **Throwaway work:** no other open ticket rewrites these files.

## Notes (non-blocking)

- `simulate-client.test.ts` reads `fetch.mock.calls[0][1].signal` and `init.method`. The shared `stubFetch` types its `init` as `RequestInit | undefined`, and tsconfig has `strictNullChecks: true`. Swapping in the shared helper may need `lastCall(fetch)` or a non-null assertion for `npx tsc --noEmit` to pass. This is setup only and the assertions stay, but the ticket does not mention it. If that is awkward, the implementer may list `simulate-client.test.ts`'s helper as a kept helper with the reason. Both outcomes satisfy the criteria.
- `REPO.md` `commands.lint` comment could mention that `lint:dup` now runs two configs. `On merge: none` is acceptable.
- The `acceptance/helpers.ts` pattern entry should be path-qualified, as the ticket already says, so other `helpers.ts` files are not matched.
