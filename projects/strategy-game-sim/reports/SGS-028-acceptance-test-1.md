# SGS-028 acceptance-test 1: PASS

Branch sgs-028-aoe4-parse-build-order-text, tip d0e6077 (was 9a73c66). Not pushed.

Harness: the ticket has no HTTP/UI boundary (the route is SGS-033), so the public surface is the module
exports. Used the existing lib Vitest convention (`*.acceptance.test.ts`, like model.acceptance.test.ts), not Playwright.
File: lib/aoe4-build-order/parse-text.acceptance.test.ts (39 tests, all pass). `npx tsc --noEmit` ok;
`vitest run lib/aoe4-build-order` 194 pass.

## Tests (criterion pinned)
- Every action/suffix/trigger kind maps to expected steps.
- civ/name/no `source`/no `start` key on ok results, including empty and comment-only text.
- `#k` inside a line is an instance; indented `#` line is a comment.
- `@60:00`, `@75:00` ok; `@1:61` syntax.
- 16 grammar-error cases (unknown prefix/action, suffix order, `walk 4 s`, `walk 4.5s`, uppercase id, negative/decimal number, missing `from`, rally missing target/arrow, trailing tokens, walk on pause, bad instance, bare `at`, trigger with no action): each one syntax issue, with line, no step.
- One issue per bad line in line order across CRLF/blank/comment lines; physical line map; both design line-map examples.
- No cross-checks (`-> nowhere`, `@75:00 ... nowhere x999`, `x0`); ids not lowercased.
- start: three valid forms; alone, repeated node, trailing tokens, trigger (both kinds), second start, start after step, start after a bad step line.
- 20,000-char performance (valid lines, long non-matching line, pathological hyphen/hash tokens) under 100 ms.
- Formatter: full round trip of start+steps; `@60:05`, `@0:00`; start first in node order regardless of key order; omitted for absent/`{}`/`{villagers:{}}`; no name/source/civ; `walk 4.5s` printed, no throw, re-parses as syntax.

## Mutation checks (each broke production code, test failed, reverted via git checkout; `git diff --exit-code` clean)
seconds>59 bound loosened; name literal changed; sawStep never set; sawStart never set; repeated start node allowed; walkSeconds added to pause; start nodes reversed in formatter; padStart removed; line index off by one; `step` added to issues; `source` added to order; formatter rounds walk; formatter drops instance; lines.start not set. All 14 failed the suite.

## Failures
None. No impl-defect or spec-gap.

## Not expressible
`git grep` no-import criterion (data/validate) and the doc-parity rule: static checks, not covered by tests here.
