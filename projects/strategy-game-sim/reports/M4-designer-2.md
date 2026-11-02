# M4 designer pass 2

Design: `design/M4.md`. Owner answers of 2026-11-02 are applied, and no owner decisions remain open.

## Decided
1. strictNullChecks, option A (C1): a precursor ticket fixes the 177 errors and makes `tsc --noEmit` pass.
   Other strict flags stay off.
2. API `text`, option C (C4, C4a): `text` is removed. A body with a `text` key gets 400, one `syntax`
   issue `request: text is no longer accepted; convert the paste to buildOrder and send that`. The key is
   rejected, not ignored, and `buildOrder` is not checked when `text` is present. OpenAPI goes to `2.0.0`.
3. Veterancy, option A (C5): units move to the upper tier when the upgrade completes. No `unitsByTier`
   field is added.

## Changed contracts
- C4 API: `SimulateRequest { buildOrder: BuildOrder; inputs?: SimInputOverrides }`. Two new issues,
  removed-`text` and `request: missing buildOrder`. 400 issues never carry `line`. The route does no text
  length check and no parse. OpenAPI: `required: ["buildOrder"]`, `not: {required: ["text"]}`, the `text`
  example deleted, version `2.0.0`. The docs Route section matches.
- C4a (new) `lib/aoe4-build-order/text-to-build.ts`: `textToBuildOrder(text, catalog): TextToBuildResult`.
  It runs the length cap, then the parse, then `checkBuildOrder` with lines. Browser-safe. It is the only
  paste path, used by page Run, pin restore and specs.
- C3: the `request` label is used for envelope issues.
- C2: `SIM_INPUT_BOUNDS.textChars` is now read only by `textToBuildOrder`.
- Modules: `text-to-build.ts` added. Rows for `parse-text.ts` and `api.ts` added. `validate.test.ts` and
  `validate.acceptance.test.ts` are deleted.

## Changed or added behavior rules
- Validation: route ordering, route order part, three removed-`text` example bodies, `{}`, route repeat.
  The old both-or-neither and 20000-character route rows are removed.
- textToBuildOrder: ordering (20000 is accepted, and 20001 gives `out-of-range` and stops), empty text,
  repeat.
- API test rewrite: all 53 `text:` bodies in three API specs. Build-only uses become `buildOrder`.
  Grammar and `line` cases move to `text-to-build.test.ts`. The page spec asserts `buildOrder` and no
  `text`.
- Page Run ordering and pin restore now call `textToBuildOrder`. A server start issue maps by its
  `start` label.
- New fixed M4.1 ticket order: strictNullChecks, then schema (the route's `text` branch temporarily calls
  `textToBuildOrder`), then the page posts `buildOrder`, then the API removes `text` (breaking, with the
  spec rewrite and OpenAPI/docs).

## Extension points
Deleted the "API clients dropping text" row. Added "other input formats", each a `<format>ToBuildOrder`
that returns `TextToBuildResult`.
