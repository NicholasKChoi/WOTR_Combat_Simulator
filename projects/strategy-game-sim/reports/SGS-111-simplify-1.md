# SGS-111 simplify 1

Changed: one trim in lib/aoe4-build-order/simulate.ts. payOrder's two adjacent early returns (not-affordable-entry and supply check) are folded into one condition. No behavior change. The rest of the diff is a clean deletion (no leftover imports, fields, or comments).

New tip: 8ac8ee9 (was 7d8b2d2). Not pushed.

Checks: npx tsc --noEmit clean; npx vitest run lib/aoe4-build-order 40 files / 1364 passed, 10 skipped; npm run lint:dup 0 clones. Acceptance specs not run (Playwright), only typechecked.
