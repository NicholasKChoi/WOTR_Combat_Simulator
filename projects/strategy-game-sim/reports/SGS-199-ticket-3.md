# SGS-199 ticket author report 3 (re-spec 2)

File: tickets/SGS-199-page-help-modal.md. Lint clean.

Applied the two gaps of spec-gate-2 and nothing else:
1. Scope existing-test rule and the "Existing tests" criterion widened to any page-wide locator or `querySelectorAll` count, set or size comparison. The `aoe4-split-scroll.spec.ts` `h3` font-size set is named as an example found at base, scoped to exclude `help-modal`.
2. Section 5 drag-handle and caret terms: title removed with one adjacent space (`Reorder chart`, `Collapse chart`) after asserting the full name equals `<verb> <title> chart`. The caret verb is read from live state, and the section needs `collapse` or `expand` for the state seen. The whitespace-normalized, case-insensitive comparison is allowed as an alternative.

Appended `## Re-spec 2 - 2026-11-16`. Changed criteria are tagged `(respec 2)`. No open questions, no diagrams, no overlap noted.
