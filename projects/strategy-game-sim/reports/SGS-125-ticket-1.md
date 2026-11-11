# SGS-125 ticket re-spec 1

Ticket: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-125-save-panel-rewrite-copy-and-versions.md` (edited in place, `## Re-spec 1 - 2026-11-10` appended, lint clean).

## Summary

SGS-125, "Rewrite the Save panel for named builds: Save as copy, Save a new version, and remove the snapshot Save", component aoe4-build-order, Risk high, about 345 business-logic lines (up from 330 for the copy-form, late-failure and conflict-lock rules), Depends on SGS-118, SGS-121, SGS-124 (SGS-114, 119, 122, 123 read as end states). Criteria cover the copy flow, name rules, reopen after reload, Save a new version, `?n=` in another context, 412 from a second tab, stubbed failures, storage unavailable (plus late create), in-flight and late answers, cross-tab list, link panel and 390 px layout, the snapshot Save removal, `savedMineEntry` rows, `save-build.test.ts` rows, docs, and the gates.

## Changes for the spec-gate findings (reports/SGS-125-spec-gate-1.md) and the revised design rows

- Gap 1 (copy form while input changes): Scope now states that `save-copy-submit` and Enter are enabled only under the Save-as-copy conditions and a valid name. Typing in the editor leaves the form and the typed name alone. Submit sends the settled input of that moment. The form closes when the selected entry key changes. It also closes on submit and stays closed after every outcome, and the typed name is not kept. New (respec 1) criteria: submit disabled by an invalid build (asserted enabled first), re-enabled after restore, the form closed on entry change, and the form closed after a stubbed 503 with the prefill reset.
- Gap 2 (named-POST hold): SGS-118 has not been re-specced and has no generic hold, so this ticket adds `holdNextNamedSave(page, method: 'POST' | 'PUT'): Promise<() => void>` to `acceptance/helpers.ts`. It works like `holdNextSimulate`, with two differences: it releases with `route.fallback()`, so an earlier-registered stub can answer a held request, and it uses a `NAMED_BUILDS_PATH` constant. If a generic path-and-method hold already exists at the ticket's start, it wraps that one instead. A criterion checks that the helper holds only its own method. The late-create and in-flight criteria now name the helper.
- Gap 3 (late failures): Scope now says a late failure shows no message and changes nothing. A late `conflict` still records the lock for the request's entry key and revision, so it only bites while that entry is still selected at that revision. A new (respec 1) criterion covers it: a held PUT with a stubbed 503 shows no message and Save stays enabled, and a stubbed 412 shows no message but Save a new version is locked. The diagram has the new transitions.
- Notes: the update call is never made while `loaded` or its revision is `null`. A late new-version criterion was added: stored revision 2, `loaded` holds the saved text, no link panel. The storage re-read now says an unpersisted, unselected entry leaves the select while its secret stays. Entry-list changes use functional updates, as in SGS-124. The docs criterion is limited to page sentences, so the script and smoke-test sections keep their correct "same content, same link" sentence about the `saveBuild` route.

## Criteria checked against `origin/main` (b3da879)

- `git grep -n "recordSave\|savedBuildName\|pinName\|postSavedBuild\|isSaveBuildResponse" -- pages components acceptance docs` currently matches `pin-name.ts(.test)`, `save-build-client.ts(.test)`, `save-build.tsx` and the page. Scope deletes all of them, and SGS-124 removes `pinName`.
- `git grep -n -w "Save build" -- components docs acceptance` matches `save-build.tsx` and `docs/aoe4-build-order.md` lines 846, 1009, 1016, 1023 and 1029, all of which Scope rewrites.
- `git grep -nE "function hold[A-Za-z]*" -- acceptance` currently matches five local copies in specs. SGS-118, which is in Depends on, deletes them, so in the end state only `acceptance/helpers.ts` matches, which is where the new helper goes.

## Diagrams

The existing state diagram is kept and extended: late failure and late 412 transitions, the form closing on submit and on an entry-key change.

## Open questions

None.

## Overlap

- SGS-118: `acceptance/helpers.ts` (it adds `holdNextSimulate`; this ticket adds `holdNextNamedSave` next to it). If SGS-118's re-spec adds a generic path-and-method hold, the ticket already says to wrap it.
- SGS-124: page entry-list updates and `pin-name.ts` (this ticket deletes the `savedBuildName` that SGS-124 retypes).
