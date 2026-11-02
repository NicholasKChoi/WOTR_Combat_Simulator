# SGS-075 spec gate 2

Verdict: READY (checked against origin/main d5c2549)

Gate 1 gap closed: Scope 4 names the mechanism (memoised `require` inside `buildOrderFrom`, fallback module
`acceptance/english-catalog.ts`), says `schema`, `text-to-build` and the catalog builder may be imported statically, and
criterion 6 is now a checkable grep plus a WOTR-spec run. Verified: `data.ts` imports its JSON statically (lines 1-3);
`helpers.ts` has only `import type` and a `model` import (types re-exported with `export type` are erased, so no data
load); `package.json` has no `"type"`; no ESLint config exists to forbid `require`; `lint:dup` is jscpd. The test title
is "29 documented types" at data.acceptance.test.ts:310, and the ticket now says 25 and to fix the schema, not cast.
Importer count (13 lines) still matches.

## Notes (non-blocking)
- schema.ts / text-to-build.ts are not on origin/main yet (SGS-057 dependency); ticket relies on them as stated.
- Criterion 6 grep `^import [^t]` would miss a default import named `t...`; harmless here.
- The require.cache check is loosely described; implementer may simply assert english.json is absent from
  `Object.keys(require.cache)` in a throwaway run.
