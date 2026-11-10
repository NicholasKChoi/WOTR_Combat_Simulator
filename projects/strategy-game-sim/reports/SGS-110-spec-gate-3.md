# SGS-110 spec gate 3

Verdict: NEEDS_SPEC (1 gap, fixable by the ticket agent plus the SGS-107/108 owner of the same fact; none needs the owner).

## Gate-2 gap

A (`annotationToneClass` null vs undefined, `StepTimes` conditional): closed. Scope 2 now writes `annotationToneClass(annotation.run ?? undefined, annotations.stale)`, renders `StepTimes` only when `run !== null`, says SGS-108's signature and `StepRunCell` are untouched. Matches SGS-108 Scope 1 (respec 2) and design Contracts line 90-91. Wording follow-ups (extraction text, lint:dup criterion) are done.

## Gap

B. **Scope 3 (and Scope 2 legend bullet) - `parsed.partial` does not exist and no ticket adds it.** The ticket reads `lines` as "`parsed.lines` when `parsed.ok`, else `parsed.partial.lines`". In the code, `parseBuildOrderText` (`lib/aoe4-build-order/parse-text.ts`, lines 7-8 and 311) returns `{ ok: false; issues }` on a syntax failure with no `partial`, and `lines` is built but dropped. `textToBuildOrder` has an optional `lines` but that is a different function and is only for check failures. The design (M7.md line 25) states the `partial` behavior as fact, and SGS-108 Scope 3 also reads `parsed.partial.order.steps`, but a grep of SGS-107, 108, 109, 110 for `parse-text` shows none of them changes the parser. An implementer reaching the page wiring would have to invent the field, its shape and its tests, and criteria 6 and 8 (syntax error keeps other lines' annotations and the legend) depend on it.
Proposed fix: assign it explicitly. Preferred: SGS-107 (the model ticket, which owns "line mapping") adds to `parse-text.ts` a `partial: { order: BuildOrder; lines: BuildOrderLines }` on the `ok: false` result (the steps and lines parsed from the lines that did not error, same `lines.steps[i]` mapping rule), with a unit test that a text with one bad line and two good lines gives `partial.order.steps.length === 2` and `partial.lines.steps` equal to the good lines' numbers, and the existing `ok: false` consumers unchanged. If SGS-107 is already READY and frozen, put it in SGS-110 Scope instead and also tell SGS-108, which has the same dependency and was gated READY without catching it. In either case SGS-110's Depends-on or Scope must name where `partial` comes from.

## Other checks (pass)

- Grounded: `BuildTextEditor` local `lineCount(text)` and the `build-order-gutter` and `build-order-line-number` markup exist; `BuildOrderLines { start?; steps: number[] }` matches `annotationsByLine`; `workbench.module.css` rule and docs text-view sentence (docs line ~820, "marks each issue's line in the gutter" at ~829 is covered by the "grep gutter" instruction); `lint:dup` exists in package.json.
- Criteria testable, no stale pins; existing-tests rule stated. Open questions none. Invariants A3, S1 named, not contradicted. Contracts match design (`StepTimes`, `annotationToneClass`, `StepKindLegend` testId, `BuildAnnotations.stale`, `StepAnnotation.run: StepRun | null`). Risk standard fits. On merge `none` valid. ~180 LOC. No diagram trigger. No trust-boundary input. No LESSONS entry found that this ticket walks into.
- `data-gutter-active` avoids the SGS-109 single `data-active` check.

## Notes (non-blocking)

- The left border needs the `kindBorder` class from `step-annotation.module.css` (named in SGS-108 Scope) as well as `KIND_CLASS[kind]`; one phrase in Scope 2 saying so removes a guess.
- `annotationsByLine` and the new `BuildTextEditor` props are in the design's Criteria map, not its Contracts block.
- The `title` on an `aria-hidden` gutter is mouse-only; the table carries the same text.
