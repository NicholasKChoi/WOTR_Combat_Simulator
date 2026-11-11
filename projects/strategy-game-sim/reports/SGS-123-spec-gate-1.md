# SGS-123 spec gate, round 1

**Verdict: NEEDS_SPEC** (two gaps, both small and closable without the owner)

Checked against design/M8.md (C5, C6, C7, "Library, select and edits", `useDiscardGuard`), CONTEXT.md, INVARIANTS.md,
LESSONS.md (both empty of relevant entries), REPO.md, `origin/main` code, and the SGS-119 ticket (no local SGS-119 branch
exists yet, so its end state was read from the ticket: it names `NAMED_BUILD_ID_PATTERN` and `EDIT_SECRET_PATTERN` as the ticket says).

## Gaps

1. **Acceptance criteria 1 (`readMyBuilds` table) - the offset ordering row contradicts the schema - an implementer
   must choose between dropping the entry and widening the schema - drop the offset form from the test.**
   The ticket and design C5 both say `updatedAt` is `z.string().datetime()`. In the repo's zod (4.6.7) that call
   rejects any offset: I ran it, and `2026-11-10T18:00:00+00:00` and `...+02:00` give `success: false`, while `...Z`
   and `...00.000Z` pass. So the row "two `updatedAt` values that differ in offset, such as `+00:00` against `Z`, order by
   instant" would have the `+00:00` entry dropped as invalid, and the test could not pass as written. The server only
   writes `toISOString()` (always `Z`), so offsets never occur. Fix: keep `datetime()` and rewrite the row to
   instants that a string compare orders wrongly: `2026-11-10T18:00:00Z` (older entry in the list order) against
   `2026-11-10T18:00:00.500Z`; the instant order puts `.500Z` first, whereas a plain string compare puts `...00Z`
   first because `Z` (90) is greater than `.` (46). Also state in Scope that an offset form such as `+00:00` is invalid
   and dropped (one more row in the "drops only the invalid elements" list), so the behavior is pinned instead of guessed.
2. **Scope, `templateEntries` and `mineEntries` - the `key` field is not stated - an implementer would guess - add it.**
   Scope lists `kind`, `id`, `name` and `loaded` but not `key`, and the acceptance rows for the two builders ("shapes")
   do not name it either. Fix: `templateEntries` gives `key: entryKey.template(name)`; `mineEntries` gives
   `key: entryKey.named(id)` (design C6 builder table); the "shapes" criterion asserts the whole `LibraryEntry`
   with `toEqual`, so a wrong key fails.

## Notes (non-blocking)

- The ticket says it adds only `templateEntries` and `mineEntries` from the C6 builder list; it is worth one clause
  that `linkEntry` and `namedEntry` (SGS-124) and `savedMineEntry` (SGS-125) are not added here. SGS-124 and SGS-125
  do add them, so nothing is lost, but the Out of scope line only mentions "building shared or link entries".
- `isEdited` is described by its formula; add the signature `isEdited(entry: LibraryEntry | undefined, live: { text: string; duration: string })` from C6 so `live` is not a guess.
- Add a duplicate-id row with equal `updatedAt` (keeps the earlier stored element) and a stable-sort row for equal
  instants; the Scope states both rules but no criterion would fail if either were wrong.
- The `git grep -n "addEventListener('beforeunload'" components` check depends on quote style; use `beforeunload`
  without the quote or call it a reviewed check only.
- Checks that passed: scope files exist or are new (`pin-storage.ts`/`.test.ts`, `pin-name.ts`, `saved-builds.ts`
  with `SAVED_NAME_MAX_CHARS = 100` all present on `origin/main`); no open questions; Invariants `none adjacent` is
  right (A1 to A3 untouched); contracts C5, C6, C7 and the `useDiscardGuard` signature match the design; the run-name,
  copy-name and `nextBuildQuery` rules match the design text; Depends-on SGS-119 is enough (the new modules need
  only its two patterns); LOC (~240) is under 400; no diagram trigger; `On merge: none` is correct (no new command,
  harness or doc); Risk `standard` is right (no criticalPaths symbol or strongModelTriggers item touched); no doc made untrue
  (nothing in `ARCHITECTURE.md` or `docs` names `pin-storage` or `pin-name`; docs are deferred to SGS-124/125);
  input validation uses zod for the stored value, as common.md requires; no existing test is edited.
