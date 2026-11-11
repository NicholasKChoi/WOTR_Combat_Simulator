# SGS-119 spec gate 2

**Verdict: READY**

Read at origin/main after `git fetch origin`. Compared the re-specced ticket with `design/M8.md` C1, `saved-builds.ts`, `.jscpd.json`, INVARIANTS.md A3 and the lessons files.

## Gate 1 gaps

1. All-`0xff` id sample: closed. The ticket expects `_____________________w` (21 `_` then `w`) and gives the arithmetic. The `design/M8.md` C1 row now carries the same value and adds the property (matches the pattern, decodes to 16 bytes).
2. Shared encoder name and home: closed. `export function base64UrlEncode(bytes: Uint8Array): string` is added to `saved-builds.ts`, and `named-builds.ts` imports it from `./saved-builds`. A new criterion pins that the btoa/`replaceAll` conversion lives only there. At origin/main the inline conversion exists only in `base64UrlSha256`, so the extraction is real and `git grep "replaceAll('+'"` will match one file afterwards.

## Checks

- **Grounded scope.** `saved-builds.ts` exports `savedBuildSchema` (a plain `z.object`, so `.extend` works) and `base64UrlSha256`. `named-builds.ts` does not exist at origin/main and the ticket calls it new.
- **Testable criteria.** Each criterion has an observable outcome. No stale numbers: the id samples are derived from the encoding rule, and the 2^53-1 bound is a design constant. The type-level `@ts-expect-error` check is verifiable by `tsc --noEmit`. No existing test is expected to change, and the ticket states that `savedBuildId` and the rate-limit tests pass unchanged.
- **Open questions.** None.
- **Invariants.** A3 is named. The only randomness is the default `random` argument, which the ticket says no simulation calls.
- **Contracts.** Every name, shape, regex and grammar matches `design/M8.md` C1, including the `parseIfMatchRevision` bound and the `Create`/`Update` response fields. There are no dependencies.
- **Dependencies and size.** Depends on none; about 150 lines.
- **Diagrams.** Not triggered.
- **Lessons.** No entry in either LESSONS.md predicts a failure here. jscpd (threshold 0, minTokens 70) is handled by sharing the encoder.
- **Decisions.** The ticket agrees with the design.
- **On merge.** `none` is valid.
- **Risk.** `standard` is defensible. It adds a contract the design fixes exactly, no `criticalPaths` symbol changes, and `base64UrlSha256` output is unchanged. `REPO.md` has no `strongModelTriggers` key to check against, so I could not check the secrets-handling reading. The ticket's own note says it is not a trigger.
- **Docs.** The ARCHITECTURE.md update is deferred to the routes ticket, and the ticket says so. No existing doc becomes untrue, because nothing imports the module yet.
- **Input validation.** Uses zod through `savedBuildSchema.extend`.

## Notes

- Optional extra null rows for `parseIfMatchRevision`: `'"1" '` (trailing space) and `' "1"'`.
- `sameSecretHash` constant time cannot be observed in a test. The ticket tests the observable behaviour only, which is right.
