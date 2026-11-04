# SGS-089 simplify 1

Rebased onto origin/main (fcfbaf1) cleanly. New tip 308d8f958a042a4a631ab8c2c4ca3ec95a266110 (rebased SHAs only).

Reviewed the diff (simulate.ts, tests, docs): already minimal; the production-time check and rally guard are single-site with no duplication or comments to trim. Result: no change, no commit.

tsc clean, lint:dup clean, vitest lib/aoe4-build-order 1091 passed / 10 skipped.
