# M2 designer, wave 4: route gaps from SGS-033

Design: design/M2.md, new block "Route request and issues" after the bounds table; Route paragraph's
`inputs` type changed. Production and Engine rules untouched.

## Answers
1. Oversized body: keep Next's default 1 MB limit (no `bodyParser.sizeLimit`); its plain-text 413 is stated in
   the OpenAPI operation prose beside the malformed-JSON 400. The caps allow at most ~120 KB, and S3 is
   enforced by the handler's own caps.
2. `inputs.trips.<node>`: partial per field. Absent fields take defaults at any depth (trips per node, then
   per field; influenceCoverage per key). New TS names in `api.ts`: `SimInputOverrides`, `TripInputOverrides`
   (= `Partial<TripInputs>`); OpenAPI uses those names, with no `SimInputs`/`TripInputs` schemas.
3. Ticket choices confirmed: both stages always run (inputs resolved even when the order failed); issues
   concatenate order first; `error` = issues[0].message; neither/both `text`+`buildOrder` = one `syntax`
   issue naming both keys; `null` counts as present; `text` over 20000 = one `out-of-range`, not parsed.
   One addition: a body that is not a JSON object gives one `syntax` issue and skips the inputs stage.

## Changed contracts
- `SimulateRequest.inputs`: `Partial<SimInputs>` -> `SimInputOverrides`.
- `api.ts` exports: adds `SimInputOverrides`, `TripInputOverrides`.
- OpenAPI schema list: `SimInputs`, `TripInputs` replaced by `SimInputOverrides`, `TripInputOverrides`.
- `resolveSimInputs` merge rule pinned to per node, then per field (signature unchanged).

## Re-spec
- SGS-033: api.ts exports (5 names), Scope 3 schema list, Open questions 1-2 closed, doc re-read covers the
  "partial SimInputs" sentence in docs/aoe4-build-order.md "Route" (trips per field, 413).
- SGS-029: change "merge per key" for `trips` to per node, then per field, with the example
  `{ trips: { farm: { walkSecondsCamp: 3 } } }`; same in its doc paragraph and the acceptance line.

## Owner flags
None. All choices are the simplest consistent with the approved design.
