# SGS-102 re-spec 3

File: tickets/SGS-102-wire-auto-run.md (edited in place; change log `## Re-spec 2026-11-09 (3)`).

Folded in:
- Gap 1: first grep now excludes `acceptance/aoe4-auto-run.spec.ts`; fetch rule is "no non-test file other than simulate-client.ts contains fetch(" (`':!*.test.ts'`).
- Gap 2 / design pass 4 item 3e: controller created in a mount useEffect, getState() copied to state, cleanup disposes. First-paint state: loading, settled = args, conversion/durationError/request computed in the hook from the args with the controller's own exported functions (no rule written twice), other fields null/empty, flush/retry no-ops. First paint shows settled check issues and duration-error. New first-paint criterion.
- Gap 3: select handler calls `editText(build.text)`; unknown name does only setSelected. New open-rows criterion.
- Notes: paused clock for undo case; 500 ms constant allowed in docs; scroll read via expect.poll or one evaluate.
- No other pass 4 change touches the page wiring.

Open questions: none. Overlap: SGS-105 already references the page's `editText`; consistent. Not run: the grep criteria were not executed against a built end state (SGS-100 not merged).
