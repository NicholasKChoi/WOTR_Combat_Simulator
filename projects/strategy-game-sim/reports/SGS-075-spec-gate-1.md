# SGS-075 spec gate 1

Verdict: NEEDS_SPEC (one gap, small; rest verified against origin/main d5c2549)

## Gaps

1. Scope 4 / criterion 6 (`buildOrderFrom` lazy catalog): the ticket says the catalog is "built lazily on first call"
   and that `git grep -n "aoe4-build-order/data'" -- acceptance/helpers.ts` "finds nothing outside the lazy catalog
   path". `lib/aoe4-build-order/data.ts` imports its JSON files statically (lines 1 to 3), so a top-level
   `import { loadGameData } from '../lib/aoe4-build-order/data'` in `helpers.ts` loads the AoE4 data when any WOTR spec
   imports helpers. `buildOrderFrom` is synchronous, so a lazy load cannot be `await import(...)`. The implementer must
   guess the mechanism (`require` inside the function, or a dynamic import elsewhere), and the grep criterion is not
   checkable ("outside the lazy path" is undefined; a static import is a hit, a `require('...data')` is not).
   Fix: state the mechanism (for example, `buildOrderFrom` calls `require('../lib/aoe4-build-order/data')` and
   `require('../lib/aoe4-build-order/schema')` inside a memoised getter, or put the English catalog in a new
   non-spec module that `helpers.ts` loads lazily), and rewrite the criterion as: "`git grep -nE "^import .*(aoe4-build-order/(data|schema|text-to-build))" -- acceptance/helpers.ts`
   prints nothing at top level (only `import type` allowed), and a WOTR-only spec run does not load `english.json`."
   Also say whether `text-to-build` / `schema` may be statically imported (they are data-free, so yes).

## Verified (no gap)

- Importer count: 13 import lines in 12 files; `validateBuildOrder` 37 lines in 10 files; route greps print 4 lines;
  docs hit is `docs/aoe4-build-order.md:615`. All match the ticket.
- `model.ts` has exactly 4 matching declarations (Trigger, BuildStep, BuildOrder, BuildStart). `export type { ... } from`
  does not match the `data.acceptance.test.ts` regex, so removing the four names from the list is right.
- `formatBuildOrderText` (parse-text.ts:397) and `listBuilds` (builds.ts:13) exist. `checkBuildOrder` /
  `checkSimInputs` return shapes in design C2 match the route's `'order' in` / `'inputs' in` handling and the
  `{ok:true,...}` form; the ticket's route text keeps behavior (405, non-object, cap, both parts run).
- Contracts match design C2, C3, C4a and SGS-057 Scope (names, `resolveSimInputs` signature, `StepOptions.names`).
- Rule for existing tests is stated (Scope 5), not a list of today's tests. Diagram present. Dependencies stated.
  Size well under 400. Risk high is correct (route validation behavior change). Invariants S3, A1, A3 named and not
  contradicted (the 20000 check moves into `textToBuildOrder`, covered by criterion 3). No open questions; LESSONS.md
  files are empty. On merge names the `CONTEXT.md` surface. Docs scope covers the stale diagram and Issues section.

## Notes (non-blocking)

- `data.acceptance.test.ts:310` test title says "exactly the 29 documented types". After removing four it is 25; say the
  title count is updated too (criterion 5 already quotes the title as "the documented types").
- Dropping the `z.ZodType<T>` annotation means `z.infer` must stay assignable both ways to old uses; `tsc --noEmit` in
  the criteria covers it, but tell the implementer a mismatch there is the signal to fix the schema, not add casts.
- `docs/aoe4-build-order.md` line 643 ("a validation issue on a pasted step carries `line` and `step`") should be
  re-read against the C3 mapping when editing the Issues section; the ticket's docs scope covers the Issues section so
  this is in scope already.
