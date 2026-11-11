# SGS-119 spec gate 1

**Verdict: NEEDS_SPEC**

Read at origin/main after `git fetch origin`. Checked the ticket against `design/M8.md` C1, `saved-builds.ts`, `.jscpd.json`, INVARIANTS.md and the lessons files.

## Gaps

1. **Acceptance criteria (id test) - the all-`0xff` expectation is arithmetically wrong, and a correct implementation fails it.**
   - The ticket says `newNamedBuildId` with all-`0xff` bytes "returns 22 `_` characters". 16 bytes are 128 bits, which is 21 full 6-bit groups plus 2 leftover bits. The last char is `11` plus four zero pad bits, `110000` = 48, which is `w`. The real output is 21 `_` followed by `w` (`_____________________w`).
   - The same wrong sample sits in `design/M8.md` C1, row `NAMED_BUILD_ID_BYTES` ("last `______________________`").
   - An implementer would either find the criterion unsatisfiable or "fix" the encoder to match it, for example by padding the last char.
   - Fix: change the criterion to "all-`0xff` gives `_____________________w` (21 `_` then `w`)". Alternatively pin it by property: the result matches `NAMED_BUILD_ID_PATTERN` and decodes back to 16 bytes of `0xff`.
   - Also correct the design sample in C1. Tech-lead or the ticket agent can do this, since it is a plain arithmetic fix rather than an owner decision.
   - For the 32-byte secret the all-`0xff` output is 42 `_` then `8`. The ticket pins only all-zero for secrets, so no change is needed there.

2. **Scope - the shared base64url encoder has no name or home.**
   - The ticket says "one small exported function" but not its name or file. Later tickets and jscpd do not depend on it, so the implementer can pick either file.
   - Fix: name it, for example `base64UrlEncode(bytes: Uint8Array): string` exported from `saved-builds.ts`. Say that `named-builds.ts` imports it there.
   - This is a minor gap; adding the name avoids a guess.

## Checks that passed

- **Grounded scope.**
  - `saved-builds.ts` exists and exports `savedBuildSchema` (a plain `z.object`, so `.extend` is valid) and `base64UrlSha256`.
  - `base64UrlSha256` builds the base64url inline today, so the extraction is real.
  - `save-rate-limit.ts` is its other caller.
  - `named-builds.ts` is declared new.
- **Contracts.** Every name and shape matches `design/M8.md` C1, apart from the sample error in gap 1. The `parseIfMatchRevision` grammar and `CreateNamedBuildResponse` / `UpdateNamedBuildResponse` also match.
- **Open questions.** None.
- **Invariants.** A3 is named and consistent.
- **Dependencies and size.** No dependencies; about 150 lines.
- **Risk.** `standard` is right. The ticket adds a new contract the design specifies exactly, and no `criticalPaths` symbol changes.
- **Diagrams.** None needed.
- **Lessons.** Neither LESSONS.md file predicts a failure for this ticket.
- **On merge.** `none` is correct.
- **Docs.** The ARCHITECTURE.md deferral to the routes ticket is explicit.
- **Input validation.** Uses zod.
- **Stale-number criteria.** None found. The only hand-computed outputs are the all-zero and all-`0xff` samples, and gap 1 fixes the latter.

## Notes

- The constant-time property of `sameSecretHash` cannot be observed in a test. The criteria correctly test only the observable behaviour: equal strings, a differing last or first char, different lengths, and empty strings.
- Optional: add `parseIfMatchRevision('"1"  ')` and a quoted value with a trailing space to the null rows.
