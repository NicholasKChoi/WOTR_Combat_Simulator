# SGS-177 review 1

Verdict: APPROVE. Tip 81b4030, base main. Full review, Chore, test-only diff (lib/aoe4-build-order/simulate.test.ts).

## Blocking findings
None.

## Acceptance criteria
- Pre-existing assertions kept: pass. The source-shape test still filters the same allowed literals ['0','1','60','5'] and counts; only the `literalsOf` body changed. simulate.test.ts ran 93 pass on the scratch.
- Apostrophe and backtick in doc comments, each followed by code with a disallowed literal: pass. Rows 1 and 2 expect ['7'] and ['8']. By reading, under the old chained replaces row 1 would report ['42','7'] and row 2 ['42','8'], so both can fail. The implementer's mutation check (block-comment alternative removed) is recorded.
- `/* 42 */` yields nothing, later code literal still reported: pass (row 3, expects ['9']).
- `//` or `/*` inside a string: pass (rows 5 and 6). Without the string alternatives, row 5 loses the `4` and row 6 reports `42`. The implementer's mutation check is recorded.
- No INVARIANTS regressions: none apply, test-only change.
- Chore check: no behavior change, no pre-existing assertion edited.
- Scope: simulate.ts, civ-rules.ts and engine-common.ts are untouched. A grep of non-test lib/aoe4-build-order files for apostrophe/backtick constraint wording found none.

## Lint
`tsc --noEmit` and `lint:dup` clean (run in scratch).

## Bot
No reviewBot configured.

## Conventions
- The it.each table follows the repo's test style. The helper is defined once and has two call sites (the test and the table).
- No ticket ids or process history in the added code, and no comments added.

## Non-blocking notes
- Single-quoted and double-quoted strings exclude newlines, but a literal unterminated string cannot occur in compiling sources, so there is no impact.
- Template literals containing `${...}` with nested backticks are not handled. Neither scanned source uses them (the implementer reports the same).

## Coverage
Reviewed the full diff plus the ticket and the implementer report. UI inspection not applicable. Scratch checkout removed after the report.
