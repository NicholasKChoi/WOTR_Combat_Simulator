# SGS-099 spec gate 2

Verdict: READY

Ticket: `tickets/SGS-099-saved-build-record.md`, read against `design/M6.md` C1, C3, C7 and origin/main (`git show` / `git grep`).

## Earlier gaps

1. 20000-character round-trip row (unbuildable input): closed. The row uses a `vi.mock` of `formatBuildOrderText` that returns 20001 characters once. It asserts 400, the issue `text: 20001 characters, more than 20000`, `error` equal to it, no 413 and no `ok: true`. Scope step 7 says no valid order reaches the cap today. This matches design C3.
2. 413 row named `name`: closed. The 413 test uses a multi-byte `source` (30,000 three-byte characters), never `name`. Scope step 6 says only `source` can reach 413. This matches design C3.

Gate-1 notes are also folded in: `error` is stated for both step-7 branches, the "claim about today's formatter" caveat is added, the `api.ts` header comment update is in Scope and criteria, and the export criterion now reads "each C1 name" plus the import grep.

## Checks

- Grounded scope: `outOfRange`, `SIM_INPUT_BOUNDS`, `buildOrderShape`, `checkBuildOrder`, `textToBuildOrder`, `formatBuildOrderText`, `MAX_REPORTED_ISSUES`, `SimulateError`, `listBuilds` and `ENGLISH` all exist on origin/main. `BuildsError` is new and the ticket says so. `saved-builds.ts` and `saved-builds.test.ts` are new.
- Criteria: each is observable. The only closed list is the C1 name set, which is replaced by "each C1 name". There are no counts or line numbers. The 20001 and 30,000 figures are test inputs, not stale pins.
- Open questions: none.
- Invariants: A1 and S3 are named, and no criterion contradicts them.
- Contracts: every C1 name and signature matches the design. The temporary private `isPlainObject` and `notAnObjectError` copy, which SGS-103 deletes, matches C7.
- Dependencies and size: none; about 150 lines.
- Diagrams: none required.
- Lessons: no entries predict a failure here.
- Decisions: the body agrees with the design, and the `walkSeconds` and plain-object decisions are applied.
- On merge: none is correct.
- Risk: `standard` is correct. It is a new contract specified with exact names, and no `criticalPaths` symbol changes.
- Docs: the grep of docs for `saved-builds`, `saved build` and `BuildsError` on main found nothing to fix. The `api.ts` header comment is in Scope.
- Input validation: `buildOrder` goes through the zod schema via `checkBuildOrder`. The hand checks are envelope only.
- Import cycle: `api.ts` stays type-only toward `saved-builds`. `MAX_REPORTED_ISSUES` is a runtime import from `api.ts` into `saved-builds.ts`, which is one-way.

## Notes (non-blocking)

- Scope step 4 says the name check uses "UTF-16 length, as `textChars` counts". `textChars` is a bounds key, not a function, so it reads loosely. The meaning (`.length`) is clear.
- The "every shipped build gives `ok: true`" loop assumes no shipped build has a name over 100 characters or a fractional time. The implementer will find out immediately if that is wrong, and the design makes the same claim.
