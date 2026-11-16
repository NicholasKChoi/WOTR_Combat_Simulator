# SGS-182 spec gate 2

**Verdict: READY**

Read at origin/main after `git fetch origin`. SGS-179 is not integrated. It only adds `MIN_SUPPORTED_VIEWPORT` to `acceptance/helpers.ts`, so base reads are valid.

## Gap 1 from gate 1: closed

- Criterion 1 and the matching Scope sentence now state behavior. Edited cases run at 1200 px wide or wider and never click or assert a tab control.
- Review reads the diff for removal of `showTab` calls and imports, the `TABS_VIEWPORT` import, and the `PHONE` and `NARROW` constants. The ticket says `tsc` proves only that no import is missing.
- There is no code search left in the criteria.

## Re-checks against the base

- The `showTab`, `TABS_VIEWPORT`, `PHONE`, `NARROW`, `VIEWPORTS` and `setViewportSize` sites the ticket names exist in all four specs.
- `build-column` exists and `aoe4-split-scroll.spec.ts` uses it, so the scroll case's column reference is grounded.
- Gate 1 probed the scroll precondition at the default viewport. The window scrolls to y=245 and `build-column` has scrollHeight 1120 against clientHeight 530. The re-spec stop branch should not trigger.
- Gate 1 also probed the my-builds layout rewrite at 1200x800. It holds on today's page.
- The ticket makes no page, component or CSS change, so no existing test depends on anything it alters. The rule for other tests is stated.
- Risk, Invariants, On merge, Unverified assumptions and Open questions are consistent.
- The ticket is test-only, so Docs is not applicable.
- There is no overlap with other open tickets. SGS-184 removes the helpers afterwards.

## Notes

- None blocking.
