# SGS-040 acceptance 1

Tip 683eb36 (on d8c9a95). Result: PASS.

Tests:
- parse-text.acceptance.test.ts "maps every action with all suffixes and both trigger kinds": extended with `move all` + node tokens (gold#2, stone#3), `when <node> runs out`, `whenever ... runs out` (reaction: true), `when wood >= 400`. Passes (39/39 in file).
- acceptance/aoe4-build-order.spec.ts "runs the default prebuilt build to 3600 s with its gold reaction and no error": textarea holds the whenever line, run at 3600 s returns 200 with durationSeconds 3600, charts drawn, no simulation-error. Passes (Playwright, chromium).

Mutations (undone, tree clean):
- parse-text.ts:201 reaction: true -> undefined: grammar test failed.
- english-1tc.json reaction true -> false: page test failed at toHaveValue.

Lint: tsc clean, lint:dup ok. No failures.
