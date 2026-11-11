# SGS-125 spec gate, round 2

Verdict: READY

Read at `origin/main` (b3da879) plus the SGS-118/121/122/123/124 tickets as they are now, and `design/M8.md` C4, C4a, C5, C6, C8, "Library, select and edits (M8.1)". The three round-1 gaps are closed: the copy form under input changes, after submit and on entry change; the named-request hold (`holdNextNamedSave`); and late failures with the late-412 lock.

## Gaps

None.

## Notes (non-blocking)

1. **`holdNextNamedSave` vs `holdNextSimulate` (SGS-118 overlap).** SGS-125 says `holdNextNamedSave` calls a generic path-and-method hold "when `acceptance/helpers.ts` already has one at this ticket's start". SGS-118 as written adds only `holdNextSimulate(page, durationSeconds?)`, releasing with `route.continue().catch`, so no generic hold will exist. The implementer has to choose between writing a second gate, which `npm run lint:dup` (threshold 0) will probably flag, and refactoring SGS-118's helper. SGS-125 also says "semantics of `holdNextSimulate`" but requires `route.fallback()` where SGS-118 says `route.continue`. Suggested sentence for Scope: "If `helpers.ts` has no generic hold, extract a private `holdRequests(page, pathGlob, matches)` that releases with `route.fallback()` and make both `holdNextSimulate` and `holdNextNamedSave` call it; changing `holdNextSimulate` from `continue` to `fallback` is allowed." SGS-118 should not need to change. Its criteria (no local hold functions, no gate-then-`route.continue` route in specs) hold either way.
2. **`NAMED_BUILDS_PATH`.** The ticket says "or the one SGS-121 put in helpers if it did". SGS-121's ticket does not add one to helpers (it only has its own specs), so the constant is new here, next to `BUILDS_PATH` (`acceptance/helpers.ts:211`).
3. **Link panel on create (implementation hazard).** The panel shows the link only while the settled input has `selected` = the new key. At click time `settled.selected` is the old key. If `onCreated`'s `autoRun.flush` is not applied in the same React batch as the panel's `setSaved`, the existing "drop when not visible" effect clears the link at once. The acceptance row (link shown and focused after a copy) catches this. A one-line hint would save a round: set the saved input's `selected` to the new key inside the panel, and call `onCreated` in the same handler.
4. **Storage event with an unpersisted entry.** The accepted behavior (an unpersisted `mine` entry that is not selected drops from the select on a re-read, its secret kept) is stated in Scope and needs no further change.

## Check results

1. Grounded scope: pass. On main, `save-build.tsx`, `pin-name.ts(.test)`, `postSavedBuild`, `isSaveBuildResponse`, `recordSave` (`pages/apps/aoe4-build-order.tsx:195`), `onSaved`, `uniqueClient`, `BUILDS_PATH` and the `.saveButton`, `.linkPanel`, `.linkInput`, `.linkHint` and `.saveError` CSS classes exist. Unintegrated modules (SGS-114, 118, 121 to 124) are marked as end states. `savedMineEntry` and `copyName` are new or from SGS-123, as C6 says. SGS-124 keeps `savedBuildName` in `pin-name.ts` "until the Save panel rewrite deletes it", which matches this ticket's deletion.
2. Criteria: testable. The pinned numbers (22, 43, 100, 101, revisions 1 and 2) are design constants or inputs. Greps are properties (`function hold...` only in helpers; deleted names absent). The existing-tests rule is in Scope: delete or move snapshot-only tests, route `?b=` opens through `apiSave`, and the implementer lists each. The end-state greps hold: `-w "Save build"` matches only main's `save-build.tsx:107` and `docs/aoe4-build-order.md` lines 846, 1009, 1016, 1023 and 1029, all rewritten. No other spec references `save-build` or `saved-build-link`. The criterion 97 carve-out keeps the script section's "same link for the same content".
3. Open questions: none; design Owner decisions 1 to 3 are approved.
4. Invariants: A3 and S3 named; no criterion contradicts them.
5. Contracts: all names match C4 (`createNamedBuild`, `updateNamedBuild`, `NamedSaveFailure`), C5, C6 (`savedMineEntry`, `copyName`) and the C8 props, test ids and visible text.
6. Dependencies and size: 345 lines under the 400 cap. Dependencies SGS-118, 121 and 124 cover 114, 119, 122 and 123 transitively.
7. Diagrams: present, and they match the Scope rules (late failure, late 412, form closing on entry change).
8. Lessons: single-evaluate rect rule is in the layout criterion; no unit test asserts CSS-module classes.
9. Decisions: body agrees with the design rows, including the late-failure row and the form rows.
10. On merge: `none`, valid.
11. Risk: `high`; correct under the template's "when in doubt" rule.
12. Docs: Scope covers "Page" and the saving section, with greps to find the stale sentences. SGS-124 edits the same section first (SGS-125 depends on it).
13. Input validation: one name field checked by hand; My builds reads go through zod (SGS-123).
