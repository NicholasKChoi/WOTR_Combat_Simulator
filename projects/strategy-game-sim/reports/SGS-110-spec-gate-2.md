# SGS-110 spec gate 2

Verdict: NEEDS_SPEC (1 gap, fixable by the ticket agent; none needs the owner).

## Gate-1 gaps

1. Tone reuse mechanism: closed. Scope names `annotationToneClass`; SGS-108 Scope 1 and design Contracts export it with the same behavior. One type mismatch remains (new gap A).
2. Legend condition and docs: closed (`lines.steps.length > 0`, syntax-error case, grep `legend` in docs, docs criterion).
3. `li` box model and width rules: closed (1.5em, nowrap, overflow, fixed-width column, `min-width: 0`, 1280 px check, 390 px rule). Criterion checks alignment by top and height.
4. Acceptance pastes: closed (spec defines its own constants and asserts API status).
Notes from gate 1 also taken: `lines` local renamed to `rowCount`, `chart-step-band` with `data-from`/`data-to` named, focused-textarea start stated.

## Gap

A. **Scope item 2, `li` class list - type mismatch with the dependency.** The ticket calls `annotationToneClass(annotation.run, annotations.stale)`. `StepAnnotation.run` is `StepRun | null` (SGS-107, design Contracts), but `annotationToneClass` takes `run: StepRun | undefined` (SGS-108 Scope 1, design line 90). Under strict TypeScript this does not compile and an implementer would guess (change SGS-108's signature, or cast). Fix: in Scope 2 write `annotationToneClass(annotation.run ?? undefined, annotations.stale)`, and say SGS-108's signature is not changed. Same for `StepTimes({ run })`, which takes a non-null `StepRun`: say it is rendered only when `annotation.run !== null`.

## Settled per the caller

SGS-110 makes no `StepRunCell` edit and uses SGS-108's exported `StepTimes`. Not a gap. Wording follow-up for the ticket agent when fixing A: Scope 2 still says the times are "written with `formatStepTime` and `finishedText` directly" with a conditional `StepTimes` extraction, and Out of scope and the `lint:dup` criterion still mention the extraction. Replace with "render `StepTimes` from `step-annotation.tsx`" so the text matches the settled decision. Also, SGS-108's ticket file on disk does not yet list `StepTimes` in its Scope (design Contracts do); SGS-110 depends on it, so the SGS-108 re-spec must add it (and say it renders `step-started`/`step-finished` with the en dash for a run with no times, which SGS-110's criterion 4 relies on).

## Other checks (pass)

- Grounded: `build-text-editor.tsx` has the local `lineCount(text)` (renamed per ticket), `.gutter, .textarea` rule and `min-width: 0` on the textarea exist in `workbench.module.css`, `BuildOrderLines.steps: number[]` matches `annotationsByLine`, docs line ~820 holds the Text view sentence, `lint:dup` exists.
- Criteria testable; no stale-number pins (0.5 and the 1280/390 px widths are design constants). Existing-tests rule stated.
- Open questions none; Invariants A3, S1 named and not contradicted; Risk `standard` fits (no strongModelTriggers, no critical path); On merge `none` valid; ~180 LOC; diagram not required; no input validation boundary.

## Notes (non-blocking)

- `annotationsByLine` and the new `BuildTextEditor` props are in the design's Criteria map but not its Contracts block; add them when the design is next touched.
- The `title` (Waited, Blocked by) on an `aria-hidden` gutter is mouse-only; the table carries the same text.
