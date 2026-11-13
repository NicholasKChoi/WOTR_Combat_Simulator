# SGS-149 ticket report 4 (re-spec 3)

File: tickets/SGS-149-test-hardening-masked-assertions.md. Lint passes.

Cause: re-spec 2 changed the walk's end condition without stating what happens when the condition is never met, and left the rendered assertion's place and carrying tests unstated.

Scope item 3 now states, for every way a stop or section can be missing:
- `lastChart` has no count assertion.
- The walk ends at the first of: both last-chart stops seen, focus leaving the last chart's section after being inside it, or MAX_PRESSES. It always returns its stops and never throws.
- The rendered assertion is a named hard assertion run in both tests after the order assertions.
- Assertion order in `expectChartControlsOrder`: key-results caret, compare-collapse before handles, handle-before-caret (both indexes >= 0), rendered, handle presence, caret presence.

Criteria changed (respec 3): handle-before-caret (last chart too), missing section, handle and caret stop each fail through their own assertion and not through a walk error, and a new criterion that the walk never throws in any end case. Re-spec 3 history appended.

Open questions: none. Overlap with other tickets: none. No diagram. No code was run; the criteria name mutations that the implementer applies.
