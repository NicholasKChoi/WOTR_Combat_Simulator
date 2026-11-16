# SGS-179 spec gate, round 1

**Verdict: READY**

Read at origin/main after `git fetch origin`. No scratch checkout was made; I judged from file reads. I ran no tests.

## Checked against origin/main
- Grounded scope: all four specs exist. `aoe4-narrow-layout.spec.ts` has 83 lines and `aoe4-small-screen.spec.ts` has 132, which matches "about 215 deleted".
- `acceptance/helpers.ts` at line 186 has `SPLIT_MIN_WIDTH`, `TABS_VIEWPORT`, `SPLIT_VIEWPORT` and `WIDE_VIEWPORT`, plus `showTab`. `MIN_SUPPORTED_VIEWPORT` is absent, and the ticket adds it with the value C5 gives in design/M10.md.
- `git grep` over origin/main for `narrow-layout` and `small-screen` finds no other reference, so deleting both files leaves no importer or doc behind.
- The sticky-at-1280 coverage claim holds. `aoe4-split-scroll.spec.ts` line 38 has "the workbench fills the viewport below the stuck run bar at the ${name} viewport", with rows for SPLIT_VIEWPORT (1280) and WIDE_VIEWPORT (1800).
- `aoe4-build-order-pin-compare.spec.ts` matches the ticket:
  - It uses `TABS_VIEWPORT` only at the line 476-477 describe.
  - Its own `runOk` helper and the "compare table sits in a scroll wrapper" case cover the reuse the ticket asks for.
  - It does not import `WIDE_VIEWPORT` today, so the moved case must add that import.
  - The reload test has the `tab-results` enabled assert and the `tab-build` `aria-selected` assert the ticket names.
- `aoe4-build-order-inline-issues.spec.ts` has `showTab` calls in the "a live issue never clears the shown result" case and the gold run-out case, as the ticket says.
- The default Playwright viewport is 1280 wide, which is at least 1200. `showTab` is therefore already a visibility assert there, so dropping the calls changes nothing. The moved cases pass on unchanged page code.
- Test dependencies: `.jscpd.tests.json` covers `acceptance` and `helpers.ts`, so the lint:dup criterion is meaningful. No other spec depends on the deleted files.
- Risk is low: test-only, no critical path. Invariants are none. On merge is none. There are no open questions and no input validation. The design inventory rows in M10.md (lines 81-83, 112) match the ticket.
- Overlap with other tickets: SGS-180 to SGS-183 each take other specs and SGS-184 takes the helper removals. None touches these four files.

## Notes (non-blocking)
- The moved 3000-character test used `PHONE.width` (390) as the bound for sideways scroll. At the default viewport the ticket does not say what the document must stay within. The implementer should compare `scrollWidth` to `clientWidth` or to the viewport width, rather than reuse the 390 constant.
- The ticket paraphrases the split-scroll case name ("fills the viewport below the stuck run bar"). It is a substring of the real title, so this is harmless.
