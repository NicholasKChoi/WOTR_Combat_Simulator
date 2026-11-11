# SGS-125 spec gate, round 1

Verdict: NEEDS_SPEC (three small gaps, none owner-only; checks 1 to 5, 7 to 13 otherwise pass)

Read at `origin/main` (b3da879) plus the SGS-118/119/121/122/123/124 tickets as end states, `design/M8.md` C1, C4, C4a, C5, C6, C8, Behavior rules, Owner decisions (approved per `plans/M8-20261110.md`).

## Gaps

1. **Scope, Save as copy / Create (copy form open while the input changes)** - owner: no.
   - Missing: the ticket enables `save-copy-submit` only on name validity. The form stays open while the user keeps editing (the run bar is sticky, the editor is live). If the settled `status` leaves `current`, or `conversion.ok` becomes false (the user typed an invalid line), submit would still call `createNamedBuild` with `conversion.order`, which is undefined when `conversion.ok` is false and stale otherwise. Also unstated: whether the form closes when the selected entry changes (the prefill came from the old entry), and what happens to the form after a failed create (the Failures rule says "nothing else changes locally", but the form closes on submit per the design row "The form is already closed (it closes on submit)", and the ticket never says so).
   - Why an implementer would guess: three plausible behaviors (submit disabled, form auto-closes, submit uses captured input), and the spec rows for in-flight and late answers depend on it.
   - Fix: add to Scope: "`save-copy-submit` is disabled unless the Save-as-copy conditions hold (`status === 'current'`, `conversion.ok`, not `busy`, not saving) as well as the name being valid. The form closes on submit and stays closed after a failure (the typed name is not kept). The form also closes when the selected entry key changes." Add one acceptance row: with the form open, a text edit that makes the build invalid (or not yet settled) disables `save-copy-submit` (asserted enabled first).

2. **Scope, Specs vs criteria (holding the named POST)** - owner: no.
   - Missing: Scope says specs use `holdNextSimulate` from `acceptance/helpers.ts` with "no local hold route". `holdNextSimulate` (SGS-118) holds only a simulate POST, filtered by duration. The in-flight and late-create criteria need to hold the named `POST` (and the criteria say "gated stub or `route` hold"). Those two statements contradict each other for the named route.
   - Why an implementer would guess: either invents a local `page.route` hold (which Scope forbids in words) or tries to bend `holdNextSimulate`. SGS-118's own criterion only bans simulate holds written as local routes.
   - Fix: say "`holdNextSimulate` holds simulate runs only. A hold on the named-builds `POST` is one small shared helper in `acceptance/helpers.ts` (for example `holdNextNamedCreate(page): Promise<() => void>`, same release shape), used by every such test; the 'no local hold route' rule applies to simulate holds."

3. **Scope, Failures (late failures and the conflict lock)** - owner: no.
   - Missing: what a failure does when the settled input changed while the request was in flight. Today's code returns early and shows nothing; the ticket says a failure shows the message "hidden when the settled input changes", which makes a late message vanish at once. For a late 412 it is unstated whether Save a new version still locks.
   - Why an implementer would guess: the lock is a correctness rule (the revision is stale), the message is cosmetic, and the two can be implemented either way.
   - Fix: add "A failure that lands after the settled input changed shows no message (as today), but a late `conflict` still locks Save a new version."

## Notes (non-blocking)

- Scope uses `entry.loaded.revision` in the update call. `loaded` is `null` for a `mine` entry before its fetch completes, and `revision` can be `null`. `edited` is false then, so Save is disabled, but say "the update call is never made when `loaded` or its revision is null" so the type narrowing is not guessed.
- The late Save-a-new-version path (settled input changed in flight) is specified in Scope and the design but no acceptance row exercises it; only the late create is covered. Consider one row (held `PUT`, edit past the settle pause, release: stored revision 2, option `loaded` is the saved text so the marker compares against it, no link panel, `my-builds-unavailable` rule when storage throws).
- Scope names a `storage` listener rule that drops unpersisted `mine` entries from the list (`mineEntries(list)` replaces them) while keeping their secrets; harmless, since storage events are not fired when storage is unavailable, but a sentence would settle it.
- Criterion "git grep ... `pinName`" also covers `docs`; docs on `main` do not mention it, so it holds in the end state. `-w "Save build"` matches only the six sentences at `docs/aoe4-build-order.md` lines 846, 1009, 1016, 1023, 1029 and the component text, all of which Scope rewrites. The "Saving a build from a script" section keeps "the same content always returns the same link" (line 1053, true for the route), while criterion 86 forbids that sentence for the page; keep the two apart when rewriting.

## Check results

1. Grounded scope: pass. `save-build.tsx`, `build-input.tsx` (`builds`, `onSaved`), page `recordSave`/`pinName`, `pin-name.ts(.test)`, `postSavedBuild`, `isSaveBuildResponse`, `saveFailureMessage`, `SAVED_NAME_MAX_CHARS`, `sameInput`, `apiSave`, `postBuild`, `uniqueClient`, the `x-forwarded-for` fixture, and the helpers named for deletion (`clickSave`, `saveThroughUi`, `isBuildsPost`, `expectLinkId`) exist in `aoe4-save-open.spec.ts`; the not-yet-integrated modules are marked as end states.
2. Criteria: testable, except gaps 1 to 3 above. Numbers in criteria are inputs or design constants (22, 43, 100, 101, revisions). Existing-test rule is stated (delete or move, implementer lists).
3. Open questions: none; design owner decisions 1 to 3 are approved.
4. Invariants: A3 and S3 named, no contradiction.
5. Contracts: all names match C1, C4, C5, C6, C8 and the C8 text table.
6. Size and dependencies: 330 lines; dependencies cover 118, 121, 124 (114, 122, 123 arrive through 124).
7. Diagrams: present.
8. Lessons: single-evaluate rect rule is in the layout criterion; no unit test asserts CSS-module classes.
9. Decisions: consistent with design.
10. On merge: `none`, valid.
11. Risk: `high`, correct.
12. Docs: Scope covers every stale doc sentence found by grep (lines 845 to 858, 963 via the page ticket, 1009 to 1029).
13. Input validation: no new trust-boundary input beyond the 1-field name; My builds reads go through zod (SGS-123).
