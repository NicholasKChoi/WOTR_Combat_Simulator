# SGS-124 spec gate 2

**Verdict: NEEDS_SPEC** (two gaps, both mechanical; no owner input needed)

Read at `origin/main`. SGS-114, 119, 122 and 123 are not integrated, so I read their tickets and `design/M8.md` C4 to C8 and "Library, select and edits" for the end states.

Gate 1 gap: closed. The `initialB` search is now `-w`, and Scope and the criteria add the handler-or-effect rule for every `.current =` in the page. Gate 1 notes: `busy` before `router.isReady` and the functional entry merge are now in Scope with spec cases.

## Gaps

1. **Scope "Entry list updates are functional" - precedence on a key collision is unstated - an implementer would guess, and one guess loses the loaded version.**
   Scope says every update "adds or replaces by key". The My builds read produces `mineEntries(...)` with `loaded: null`. If the initial `?n=<id>` load (id in My builds) ends before the hydration effect runs, or any time the load ends first, then "replaces by key" lets the My builds read overwrite the fetched entry and null its `loaded`. After that `isEdited` is `false` for the selected entry (no marker, no discard guard) and `runName` stops matching its text. The criterion "Entry list merge" only tests the opposite order (load ends after the My builds read), so it cannot catch this.
   Proposed fix: state the rule per writer: the My builds read adds only entries whose key is absent (an existing entry, with its `loaded`, wins); a load result replaces by key, keeping the stored `name` of an existing `mine` entry and replacing only `loaded` (already stated). Add a criterion or unit-level case for the reverse order, for example a gate that opens before the My builds effect runs, or a pure merge helper with rows for both orders. Keep the existing gated-after case.

2. **Scope "Specs", rule for existing tests - the rule covers a changed select and `b` behavior but not the new `beforeunload` guard - an implementer would guess how to treat existing tests that leave an edited page.**
   The rule names `b` dropped by an edit, a select value being a build name, and a selection after an edit with no dialog handler. Adding `useDiscardGuard(edited)` also changes every existing test that edits the text or duration (or selects a build, then edits) and then calls `page.reload()` or `page.goto(...)` on the same page. On main, `aoe4-build-order-pin-compare.spec.ts` does this in many places (it fills the text or duration, then `page.reload()` at about lines 274, 414, 472, 543 to 750). Playwright auto-dismisses a `beforeunload` dialog when no handler exists, which cancels the navigation or makes `reload` time out. The ticket's acceptance criterion tells the implementer to run `aoe4-build-order-pin-compare`, but not what to do with these.
   Proposed fix: add to the rule: "a test that leaves a page that is edited at that moment (reload, `goto`, or navigation through a link) accepts the `beforeunload` dialog (`page.once('dialog', d => d.accept())`) or restores the text first; it keeps its other expected values. The implementer lists each such test." Put the handler in a shared helper in `acceptance/helpers.ts` if more than two tests need it.

## Notes (non-blocking)

- **Order of added entries.** "Prepended to the opened entries" (initial `?b=` load) and design C6 "Opened links (in open order)" read differently; main prepends. Only the initial load adds an opened entry in this ticket, so no behavior differs. Say "first in Opened links" or drop "prepended".
- **`readMyBuilds` in the initial `?n=` branch.** `readMyBuilds` removes the key on a whole-value parse failure (SGS-123), so this read has a write side effect. Harmless, since the hydration effect does the same, but a reviewer may ask.
- **Doc grep.** The listed grep strings hit `docs/aoe4-build-order.md` lines 845, 853, 854, 1017 and 1018; lines 848, 858, 1010, 1013, 1021 and 1081 also mention `?b=` or the select. They are covered by the `?b=` grep, but the implementer should read each.

## Checks passed

1. Grounded scope: `build-input.tsx`, `pin-name.ts` and its test, `saved-build-loader.ts` and its test, `save-build.tsx`, the page, the listed specs and the docs sections exist on main. `aoe4-my-builds.spec.ts`, `browser-storage.ts`, `build-library.ts`, `build-query.ts` and `use-discard-guard.ts` are marked new or belong to named dependencies. `urlBaseline`, `initialB`, `pinName` and `PrebuiltBuild` exist on main only in files Scope edits or deletes, and `buildName` only in files Scope edits (the other hits are in the old SGS-105 ticket).
2. Criteria: each has an observable outcome and no stale count. The searches hold in the end state Scope requires: `initialBuildQuery` no longer matches `-w initialB`; `buildName` is deleted with `savedBuildOption`'s test and the retyped `pin-name`. The 91, 93 and 100 character figures are design constants.
3. Open questions: none, and none in CONTEXT.md.
4. Invariants: A3 and S3 adjacency is stated and no criterion contradicts them.
5. Contracts: `linkEntry`, `namedEntry`, `runName`, `savedBuildName`, `nextBuildQuery`, `initialBuildQuery`, `loadNamedBuild(id, signal)`, `browserStorage()`, `myBuildsAvailable(storage)` and `useDiscardGuard(edited)` match C4 to C7 and the SGS-114, 122 and 123 tickets. The interim `recordSave` rule matches C6.
6. Dependencies and size: SGS-114, 122 and 123 stated (SGS-119 is transitive); about 340 lines, under 400.
7. Diagram: present and matches the rules.
8. Lessons: none applies (the new specs check computed or rendered state, not CSS-module class names, and read layout in no case).
9. Decisions: CONTEXT.md Decisions is `None`; the body agrees with the design (the `?b=` and `n` wins rules, the failed-load URL rule).
10. On merge: `none`, valid.
11. Risk: `high` is consistent; no criticalPaths symbol changes.
12. Docs: in Scope with the grep strings and the described content.
13. Input validation: no new trust-boundary input (the query is read by SGS-123's `initialBuildQuery`; the responses are validated in SGS-122).
