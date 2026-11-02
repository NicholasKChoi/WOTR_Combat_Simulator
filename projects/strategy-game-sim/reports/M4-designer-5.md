# M4 designer pass 5

Input: the SGS-057 review (`reports/SGS-057-review-1.md`) approved the code and found the design wording stale. This pass rewrites `design/M4.md` in place to match what SGS-057 implemented (branch `sgs-057-aoe4-zod-schema-text-to-build`, tip `c207726`). No owner decision and no approved behavior changed. Nothing is committed.

## Contracts changed

1. **C2 `BuildOrderCatalog`** gains two fields (additive):
   - `units: readonly string[]` holds every unit baseId, producible or not. It keeps the split between `unknown-id` (`unknown unit "<id>" in unit`, suggestion from `units`) and `invalid` (`<producer> cannot produce <unit>`).
   - `inputDefaults: Readonly<Pick<SimInputs, 'trips' | 'walkSeconds' | 'nodeAmounts'>>` holds the defaults read from `data.base`. Because of it, `checkSimInputs(value, catalog)` needs only the catalog, and it equals `resolveSimInputs(partial, data)`.
   - A test that builds a catalog literal by hand must include both fields.
   - The `rejectedTechs` comment now says "first rejection by age", which matches the code.
2. **C2 `defaultStart` rule** is now recorded:
   - `villagers` is the civ's starting split with zero-count nodes dropped, in data order.
   - `rally` is set only when `startVillagerProducers` is non-empty. It goes to the most-staffed node, and a tie goes to the earlier node in data order.
   - English gives `{villagers: {sheep: 6}, rally: 'sheep'}`.
   - The value comes from the data, always passes the start checks, and C9 `start-customize` inserts it as is.

## Behavior rules changed or added

3. **Validation / check / ordering:** cross-step issues come last, after every step's field and cross-field issues, ordered by the later step's index. They are not interleaved. The row has a worked example.
4. **Validation / check / unknown action (new row):** an unknown `action` gives only `syntax` `unknown action "<action>"`. That step's other fields, `trigger` included, are not checked. As a field issue it also suppresses all cross-step checks. The order is still rejected.
5. **textToBuildOrder / empty text `''`:** empty text is not special-cased. It parses to `{civ:'english', name:'Pasted build order', steps:[]}` and returns that order's `checkBuildOrder` result with `lines {steps: []}`. For English that is `ok:false` with one issue, `invalid` `start: no start.rally while starting building capital-town-center produces villagers`. Whitespace-only and comment-only text behave the same way.
6. **Extension points / other input formats:** the row now says the conversion ends in `checkBuildOrder` for every input that converts, empty input included. This makes it consistent with rows 435 and 436.

## Downstream re-spec

| ticket | needs re-spec? | conflicting text |
|--------|----------------|------------------|
| SGS-057 | wording only (in review, code is correct) | Scope line 51 catalog field list (add `units`, `inputDefaults`); line 64 issue order ("after all per-step issues"); line 123 `''` returns what `parseBuildOrderText('')` returns. Replace it with change 5. The review says this bullet is not an acceptance criterion |
| SGS-075 | yes | Scope 5 "Rule for existing tests" lets only the field vs cross-field rule and the new issue order change an expected list. It must also allow change 4 (unknown action hides the step's trigger issue) and the trailing cross-step order (change 3). Scope 6 docs text must state both. The review's non-blocking notes also apply: un-export or delete `isKnownId`/`isBoundKey` (and `issue` if unused) once validate.ts is gone, and shrink the export-list criterion to match |
| SGS-058 | no | no conflicting text |
| SGS-059 | no | No empty-text or catalog-literal wording. An empty textarea Run now shows the start no-rally issue, which follows from the existing Run rule |
| SGS-060 | no | The issue-cap bad step (`produce` with an unknown unit, no trigger) still yields exactly one issue, because trigger is optional |
| SGS-061 | no | Line 91 keeps the SGS-057/075 validation text. Nothing contradicts it |
| SGS-068 | no | It uses `catalog.defaultStart` generically (criterion line 109 compares against `formatBuildOrderText({...order, start: catalog.defaultStart})`). It can optionally cite the English value. Any hand-built catalog literal in its tests needs `units` and `inputDefaults` |
| SGS-072 | no | `pinName` empty text is unrelated to the check. Pin restore of a failing text already clears the pin |
