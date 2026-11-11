# SGS-124 spec gate 1

**Verdict: NEEDS_SPEC** (one blocking gap, a mechanical fix; no owner input needed)

Read at `origin/main`. SGS-114, 119, 122 and 123 are not integrated, so I read their tickets and `design/M8.md` C4 to C8 for the end states.

## Gaps

1. **Acceptance criteria, "No ref is written during render" - the `initialB` search forbids what Scope adds - an implementer would hit a failing criterion or rename a design contract.**
   `git grep -n "initialB" -- pages components` also matches the substring in `initialBuildQuery`. Scope requires the page to import and call `initialBuildQuery` (and `InitialBuildQuery`). SGS-123 adds both to `build-query.ts` under `components/`, and design C7 fixes the names. The criterion can never hold in the end state Scope requires.
   Fix: replace it with a word-boundary search, for example `git grep -nw "initialB" -- pages components` finds nothing (`-w` does not match `initialBuildQuery`). Alternatively search for the ref itself: `git grep -n "initialB\.current" -- pages components`. Keep `urlBaseline` as is. Also state that `useRef` is not written during render in the page (the existing `pinTouched` ref is written only in handlers).

## Notes (non-blocking)

- **Busy before the router is ready.** Scope says `busy` follows the same condition as `hold`, and `hold` is true while `initialQuery` is `null`. On main, `busy` is `savedLoadInFlight`, which is false until `router.isReady`. Read literally, the select, duration and editor are disabled and `aria-busy` is set on every first paint of every page load. Existing specs that click right after `goto` may flake. Say whether `busy` is true while `initialQuery` is `null`. Suggested: keep today's meaning, `busy` only while `initialQuery` is not `null`/`none` and its load has not ended, while `hold` also covers `null`.
- **Entry-list effect ordering.** The My builds effect and the initial-load effect both add entries after hydration. Say the page updates `entries` with functional updates, so a late load result and the hydration effect cannot overwrite each other (the criteria only test the stored-id case).
- **Contracts match.** `linkEntry` and `namedEntry` match the C6 builder table, `runName` and `savedBuildName` match C6 and SGS-123 (including `Custom build` with no suffix), and `nextBuildQuery` and `initialBuildQuery` match C7. The interim `recordSave` rule matches C6.
- **Checks passed.** Files named in Scope exist on main (`build-input.tsx`, `pin-name.ts`, `saved-build-loader.ts` and its test, `save-build.tsx`, the page, the listed specs) or are new and marked new. The stale-doc grep strings hit docs/aoe4-build-order.md lines about 845, 853, 1017 and 1018. The `Prebuilt build` label exists only in `build-input.tsx`, and `buildName` only in the files Scope edits. The rule for existing tests is stated, the diagram is present, Invariants and Risk (high) are reasonable, On merge is `none`, Open questions is none, and size is about 340 lines. No LESSONS entry applies. Input validation does not apply (no new trust-boundary input; `MY_BUILDS` schema is SGS-123).
