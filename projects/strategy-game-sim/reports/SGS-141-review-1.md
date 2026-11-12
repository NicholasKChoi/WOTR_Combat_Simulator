# SGS-141 review 1

Verdict: APPROVE (branch sgs-141-split-tab-order-spec-and-final-docs-pass, tip 373c4d6, base 90b909e)

## Blocking findings
none

## Acceptance criteria
- Edited state: pass. `aoe4-split-tab-order.spec.ts:93-101` asserts link hidden, `save-build` visible and enabled, then walks; order duration-seconds, editor-view-text, save-build, save-build-copy, build-column, results-column, with strictly rising document position (`expectInOrder`).
- Link state: pass. Asserts link visible and `save-build` disabled, walks, checks the order through copy-saved-link, `save-build` not a stop, and `save-build` before `save-build-copy` in DOM. Implementer's mutation probes (swapped columns, moved Save as copy) failed the spec.
- Walk to last chart caret with cap: pass. `lastChart` takes the last rendered section; 150-press cap throws. `compare-collapse` before every handle, and handle before caret per section, matched through `closest()` of the section.
- No positive tabindex: pass (`expectNoPositiveTabindex`, both states).
- One evaluate per step; helpers shared: pass. `editedCopy` and `EDITED_COPY_TEXT` moved into `acceptance/helpers.ts`; `saveCopy` was already exported there. my-builds spec imports it, and its text equals the former `VALID_A` (`REMOTE_TEXT`). `lint:dup`: 0 clones (I ran it).
- Docs Tab-order sentence: pass. Page section sentence matches the DOM order in `save-build.tsx` and the walk.
- End-state grep: I re-ran it and it finds no match in docs or ARCHITECTURE.md.
- `Per villager|strictNullChecks` grep: no match, nothing kept.
- ARCHITECTURE.md state, comment grep, M9.9 coverage: pass. The criteria-to-doc map in the implementer report is credible. Spec files exist for each topic: save-status, chart-layout and key-results-collapse (reload), pin-compare (`chart-pinned-legend`), chart-views, marker-labels (hover and focus), split-tab-order.
- Lint: `tsc --noEmit` and `lint:dup` clean (I ran them). I did not run `npm test` or acceptance, per the gate rules; I judged coverage by reading.
- Invariants: none apply (the diff touches only acceptance specs and docs).

## Spec gaps
none

## Bot reconciliation
No `reviewBot` CLI or rules file configured.

## Non-blocking notes
- `EDITED_COPY_TEXT` in `acceptance/helpers.ts:361` repeats the literal behind `REMOTE_TEXT` (`aoe4-my-builds.spec.ts:50`). It is two lines, and jscpd finds no clone. It could import the constant.
- The edited-state ordering of `save-build` and the tabindex check were not mutation-probed by the implementer. I judged by reading that they can fail: `save-build` is asserted enabled and must appear in the stops.
- UI inspection not run: the diff changes no UI.

## Coverage
Reviewed the full diff: new spec, `helpers.ts`, `aoe4-my-builds.spec.ts` and the docs line. Read the cited spec files only by grep.
