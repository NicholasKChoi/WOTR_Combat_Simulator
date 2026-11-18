# SGS-205 review 6

Verdict: APPROVE. Tip d5c37714fd36e0b5cd7d1f059fa666c4fcd00a7d, base origin/main.

## Blocking findings
None.

## Judgment on the margin (0.9px)
Not a defect. Criterion 1 requires a strictly larger computed size than the dialog paragraphs, and 22.5 > 21.6 satisfies it. Criterion 2 pins section headings to the chart title's size, and the chart title is `h5` (chart-header.tsx:53). Any larger Bootstrap class would break the chart-title match, and the ticket forbids new font-size rules. The thin margin comes from the dialog paragraphs rendering at 21.6px rather than the 18px the ticket assumed. The ticket's intent is met. The regression test uses `toBeGreaterThan(body)`, so it stays meaningful if the margin changes.

## Acceptance criteria
1. Pass. The new spec asserts heading > max paragraph and title > heading, per section. The implementer's mutation record shows h6 (the base) fails at 18 vs 21.6, and h4 fails at 27 vs 27.
2. Pass. The spec asserts `toBe(chartTitle)` per heading, and the chart title is read from the rendered chart (`RATES` `h3`) after the page has run. The inline 24px mutation fails the equality assertion (got 24, expected 22.5).
3. Pass. The only production change is `h6` to `h5` at page-help.tsx:25. Tags, ids, `aria-labelledby` and text are untouched, and no pre-existing test is edited.
4. Pass. No invariants apply (UI class only).

## Type checks (Bug)
- The regression test fails at the base on the assertion that names the bug ("larger than the body text"), per the implementer's record.
- The fix is at the named cause (`HelpSection`'s `h3` class).
- The spec file's shared helpers (`openPage`, `openHelp`, `sections`, `RATES`) are reused and nothing is redefined.

## Contract, scope, conventions
- Out of scope respected: `chart-legend.tsx` and `page-help.module.css` are untouched, and no new styles were added.
- Doc claims: none added; docs left unchanged, as the ticket allows.
- Test hygiene: one test with a loop over the sections, no copied blocks. It first asserts the section count and heading count, so it cannot pass on empty data.
- The assertion `expect(heading, 'the chart title size')` has a clear message.

## Lint and bot
- I did not run `commands.lint`. The scratch has no installed dependencies, and the implementer reports tsc and `lint:dup` clean. This is unverified by me.
- No `reviewBot` is configured.
- I did not run the UI inspection: the ticket's own acceptance spec measures computed sizes in Chromium, and the review gate runs no acceptance tests.

## Non-blocking notes
- The ticket Context states the body as 18px, but the dialog paragraphs measure 21.6px. The ticket text is slightly inaccurate but harmless.

## Coverage
Reviewed: the full diff (page-help.tsx and aoe4-help-modal.spec.ts), chart-header.tsx:53, page-help.tsx heading classes, and the font-size rules in global.css. Not reviewed: runtime behavior, since no tests were run.
