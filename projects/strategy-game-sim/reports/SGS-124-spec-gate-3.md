# SGS-124 spec gate 3

**Verdict: READY**

Read at `origin/main` (after `git fetch origin`). SGS-114, 119, 122 and 123 are not integrated, so I read their tickets and `design/M8.md` C4 to C8 and "Library, select and edits" for the end states.

## Gate 2 gaps: closed

1. Key collision between the My builds read and a load result: Scope now states a rule per writer through two pure functions, `withMyBuilds` and `withLoadedEntry`. A load result keeps a stored `mine` name and replaces only `loaded`. The My builds read keeps `loaded` from the listed entry. The order-independence unit criterion (deep-equal in both orders, with rows a to d) covers both orders. The names are recorded in CONTEXT.md Key surfaces.
2. Existing tests and `beforeunload`: Scope adds `acceptBeforeUnload(page)` in `acceptance/helpers.ts` and a rule for tests that leave an edited page. There is a matching criterion, and the implementer lists every edited test. On main `aoe4-build-order-pin-compare.spec.ts` has 18 `reload()` / `goto(` / `dialog` hits, so the rule is needed and applies.

Gate 2 notes: "prepended" is replaced by open order (new opened entry goes last). The `readMyBuilds` side effect is noted. The doc grep strings are updated.

## Checks

1. Grounded scope: on main, `urlBaseline`, `initialB`, `pinTouched`, `PrebuiltBuild`, `pinName`, `buildName`, `savedBuildOption` and the "Prebuilt build" label all exist only in files Scope edits or deletes (`build-input.tsx`, `pin-name.ts` and test, `save-build.tsx`, `saved-build-loader.ts` and test, the page). The existing not-found and failed texts ("Showing the default build.") are at page lines 62 and 63. New modules belong to the named dependencies, and the new spec and `acceptBeforeUnload` are marked new.
2. Criteria: each has an observable outcome. The end-state searches hold: `initialBuildQuery` does not match `-w initialB`, and every `buildName`, `pinName` and `PrebuiltBuild` hit on main is removed by Scope. The 91, 93 and 100 character figures are design constants. No stale counts, and the existing-test rule is a rule, not a list.
3. Open questions: none in the ticket or CONTEXT.md.
4. Invariants: A3 and S3 adjacency is stated, and no criterion contradicts them.
5. Contracts: `LibraryEntry`, `linkEntry`, `namedEntry`, `entryKey`, `entryLabel`, `isEdited`, `runName`, `savedBuildName`, `nextBuildQuery`, `initialBuildQuery`, `useDiscardGuard` and `LIBRARY_GROUPS` match design C6 and C7 and the SGS-123 ticket. The two new merges are added to CONTEXT.md. The interim `recordSave` URL rule matches design line 544.
6. Dependencies and size: SGS-114, 122 and 123 stated (SGS-119 is transitive; SGS-118 is explicitly not a dependency, with a merge-order rule for `helpers.ts`). About 355 lines, under 400.
7. Diagram: present and matches the rules.
8. Lessons: nothing walked into. The new specs assert rendered or computed state.
9. Decisions: CONTEXT.md Decisions is `None`. The body agrees with the design (`n` wins, the failed-load URL rule, URL follows the selected entry).
10. On merge: `none`, valid. The CONTEXT.md Key surfaces line is already added.
11. Risk: `high` is consistent, with the rationale given. No `criticalPaths` symbol changes.
12. Docs: `docs/aoe4-build-order.md` is in Scope with grep strings and the described content.
13. Input validation: no new trust-boundary input (the query goes through SGS-123's `initialBuildQuery`, the responses are validated in SGS-122, and the stored list in SGS-123).

## Notes (non-blocking)

- The `.current =` rule is a review check, not a mechanical search. Acceptable, since `pinTouched` is today only assigned in handlers (page lines 204 and 211).
- Coordination: SGS-118 and SGS-124 both edit `acceptance/helpers.ts`. The merge-order rule in Scope covers it.
