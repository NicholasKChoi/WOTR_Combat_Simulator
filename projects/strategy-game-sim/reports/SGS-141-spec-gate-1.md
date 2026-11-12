# SGS-141 spec gate 1

Verdict: NEEDS_SPEC

Read at `origin/main` (after `git fetch origin`) plus the SGS-128 to SGS-140 ticket files for the Depends-on end states.

## Gaps

1. Scope 1 / criteria 1 and 2 - the walk cannot supply the data the Results-column assertion needs - Scope 1 ends the Tab walk "until focus has reached the Results column" and forbids extending it through the legends. The first stop in `results-column` is the key-results caret (design "Tab order" row: key-results caret and pin buttons come first). So the walk stops before any chart's `chart-drag-handle` or `chart-collapse`. Yet "Assert this on the stops the walk already records" requires the handle before the caret in every chart, and the key-results caret before every chart's handle. An implementer must either extend the walk (the ticket forbids it) or invent a different mechanism. Proposed fix: end the walk after the last chart's `chart-collapse` caret (or after a fixed count of Tab presses with a stated stop condition), and keep "do not walk the legends, drag or table view". Reword the "recorded stops" rule to say the walk continues through all chart headers.

2. Scope 1 / criteria 1 - the key-results caret and chart control selectors are not named - The ticket names test ids for the run bar and columns but not for the Results stops. Source tickets name `key-results-collapse` (SGS-134), `chart-drag-handle` and `chart-collapse` (SGS-135). None exist at `origin/main` (only `chart-collapse` does). Proposed fix: name them in Scope, and state that each chart's pair is identified by its section, so "that chart's caret" is unambiguous.

3. Scope 1 - the save-flow helper source is conditional - "the helpers SGS-132 left in `acceptance/helpers.ts` (or the ones it moved there from `acceptance/aoe4-my-builds.spec.ts`)". SGS-132's own text says to move a helper only "when the new spec needs the same helper". At `origin/main`, `saveCopy`, `editedCopy`, `stubNamed` and `reply` are local to `aoe4-my-builds.spec.ts`. SGS-132 may therefore leave them there, and the implementer has no instruction for that case. The jscpd gate fails on a copy. Proposed fix: state the rule: if the Depends-on tips do not export a save-as-copy helper from `acceptance/helpers.ts`, move `saveCopy` (and what it needs) there and import it from both specs. Verify against the SGS-132 tip before the ticket is marked ready.

4. Scope 1 / criterion 1 - `save-build` conditional can pass vacuously - "either starts from a state that shows it or asserts the order without it and says which in a comment" lets the spec skip the `save-build` ordering check. Proposed fix: pick one state. Either use the post-save-as-copy state that shows `save-build` (check it appears there, since M9.9's design row lists it) and assert it unconditionally, or state that the spec asserts the absence case. Do not leave it to the implementer.

5. Scope 2 / criterion 6 (grep) - the grep may match legitimate new text - The end-state grep includes `Per villager` and `strictNullChecks`. A feature ticket (SGS-137, SGS-129) might legitimately write "replaces the former Per villager checkbox" in the docs. The criterion would then force removing accurate text. Proposed fix: state that a match is allowed only in a sentence that says the thing was removed, or drop those two terms from the end-state grep and keep them in the audit method.

## Checks that passed

- Existing ids at `origin/main`: `build-order-select`, `duration-seconds`, `editor-view-text` (built as `editor-view-${option}`), `save-build`, `save-build-copy`, `saved-build-link`, `copy-saved-link`, `build-column`, `results-column` (the last two render only in the split layout).
- `SPLIT_VIEWPORT` exists in `acceptance/helpers.ts`; `.jscpd.json` currently omits `acceptance/` (SGS-128 adds it).
- The editor has no Tab trap (no `'Tab'` handling in components or pages); the only `tabIndex` in the code is on `workbench-tabs.tsx` (0 or -1, never positive).
- The stale-statement grep does find matches today in `docs/aoe4-build-order.md` and `ARCHITECTURE.md:11`, as the ticket says.
- Docs ownership table is consistent with the feature tickets; the Tab-order statement is placed in Scope; open questions none; invariants none is plausible; no product code touched; risk low is right; On merge `none` is valid.
- Dependencies cover all feature tickets; SGS-139 is listed as a ticket file, so the C8 fallback is only for the integration state.

## Notes

- Criterion 5 (every M9.3 to M9.13 behavior has a sentence, report lists each) is a manual audit. It is acceptable as written because the method is given and the report is the evidence.
- "Unverified assumptions: none" is fine for Tab traversal in Chromium; the spec is real-browser.
- The design Tab row says "1200px and up"; the ticket tests 1280x800 only. Fine.
