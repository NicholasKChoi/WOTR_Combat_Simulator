# SGS-211 spec gate (report 4)

Verdict: READY

Ticket lint: no errors, no warnings. Code read at origin/main; SGS-208 and SGS-210 are unmerged drafts with no branch, so their contracts were read from their ticket files and design/M12.md.

## Gap check against report 2

All three gaps from report 2 are closed:
1. "After a reload" is gone; the copy list is "closed on first render" only.
2. The page spec now lists each case: Repeat offered on build and move only, letters leave the line unchanged, `0` gives a `build-order-issue` with `data-code="out-of-range"` and the step's `data-line` (test id and attributes exist in `issue-list.tsx`), and a pasted `xN` row starts open.
3. The round-trip row is named in `lib/aoe4-build-order/saved-builds.test.ts`.

## Checks

- Grounded scope: `parseAction`, `parseProduce`, `COUNT`, `Tokens.end`, `withWalk`, `formatAction`, `actionFields`, `changeAction`, `hasOptionalField`, `openFlags` and `mergeExternalEdit` all exist at the base and behave as the ticket describes. The step table closes a row on an action change (`open.map((was, i) => i !== index && was)`), as the ticket states. `acceptance/aoe4-build-order-step-band.spec.ts` exists as the exemplar and already reads `chart-step-band` `data-from` and `data-to`.
- Parse forms hold against the grammar: `pause capital-town-center`, `rally ... -> wood` and `research ... at mill` all end where a trailing token would sit. `move 3 sheep to x9` takes `x9` through `NODE_TOKEN`. `produce` keeps `COUNT` in the count slot only.
- Contracts match design C3, C1 and C7 and the SGS-208 and SGS-210 tickets: `REPEATABLE_ACTIONS` in `repeat.ts`, `FIELD_LABELS.repeat` added by SGS-208, `repeat` in `OPTIONAL_STEP_FIELDS` for build and move, and the `step-copies`, `step-copy-list`, `step-copy`, `data-copy` and `Each copy` markup.
- Docs: grep of `docs`, `components`, `pages` and `lib` for `xN`, `walk Ns` and "always last" finds exactly the format-doc lines the ticket names (67, 72, 96, 98, 102). No other doc is made untrue.
- Risk `standard` is right: no `criticalPaths` symbol is touched. Invariant A3 is named. `On merge: none` is correct. Input validation is not extended (no new hand-rolled fields). No throwaway overlap with SGS-208 or SGS-210. Business logic is about 70 lines.
- Existing tests: the rule covers them. No pinned counts or closed lists.

## Notes (non-blocking)

- The page spec asks for the span from "the response of the run" without naming how to capture it. Use the `page.waitForResponse` pattern or `helpers.ts` if it has one.
- SGS-211 cannot start until SGS-208 (draft, high risk) and SGS-210 are integrated, since it imports `repeat.ts` and relies on the copy-list markup.
