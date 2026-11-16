# SGS-182 spec gate 1

**Verdict: NEEDS_SPEC** (one gap, small)

Read at origin/main (6411526). SGS-179 is not integrated and only adds `MIN_SUPPORTED_VIEWPORT = { width: 1200, height: 800 }` to `acceptance/helpers.ts`, so base reads are valid. All other checks pass, with the exceptions noted below.

## Gaps

1. **Acceptance criterion 1 (and the Scope sentence "ends with no showTab call or import ... no tab-build / tab-results test id")** - it is a search over code, and its typecheck backstop does not work. `tsconfig.json` has no `noUnusedLocals`/`noUnusedParameters`, so `npx tsc --noEmit` does not flag an unused `showTab`, `TABS_VIEWPORT` or `PHONE`; it only catches missing imports. `tab-build`/`tab-results` are strings, so no typecheck sees them. The page still has tabs until SGS-184, so no test can prove their absence yet. An implementer would trust "tsc passes (no unused or missing import)" and could leave dead imports or constants. Proposed fix: restate the criterion as behavior and reviewable diff content. "The edited cases run at viewports 1200 px wide or wider, never click or assert a tab control, and the diff removes every `showTab` call/import, `TABS_VIEWPORT` import, `PHONE`/`NARROW` constant." Say that review reads the diff for this, and that `tsc --noEmit` only proves no missing import. A line of scope text keeps the unused-import cleanup obligation. Drop "no unused" from the tsc claim.

## Verified (no gap)

- Every named case, describe, helper and constant exists at the base: `PHONE` (save-open L25, my-builds L497), `NARROW`/`VIEWPORTS` (save-status), the `layout` describes, `TABS_VIEWPORT` describes in auto-run, the 390 px scroll case, and `showTab` call sites (save-open L125 and L164; my-builds L491; auto-run L159, 176, 180, 201, 287).
- The `AUTO_RUN` scroll-case precondition holds at the default viewport (Desktop Chrome, 1280x720). I probed it on a scratch checkout at origin/main. `scrollInstantly(page, 400)` lands at y=245 (>0). `build-column` has scrollHeight 1120 and clientHeight 530, and scrollTop reaches 400 (>0). The ticket's "stop for re-spec" branch will not trigger, and the ticket may note this measured range.
- The my-builds layout rewrite holds at 1200x800 on today's page, with the copy form open and with the link panel shown. `scrollWidth` is 1200. Editor top is at least the run bar bottom (505.8 vs 417.2 with the form closed; 557.3 vs 468.7 with it open). Run bar height is at most 224 px, which is under 40% of 800.
- Source for the 40% and 1280x720 values: M10 design inventory row for `aoe4-my-builds`. The `aoe4-save-status` and `aoe4-auto-run` rewrites match their design rows.
- Test-dependence search: the ticket changes no page code, so no existing test is affected. The rule for other tests is stated.
- Risk `low`, Invariants `none`, On merge `none`, Unverified assumptions `none`, Open questions none: all consistent. No overlap with SGS-179 (different files), SGS-180, SGS-181 or SGS-183 (other spec files). SGS-184 removes the helpers only afterwards.

## Notes

- Name the Build column by test id (`build-column`; `aoe4-split-scroll.spec.ts` already uses it) in the scroll-case scope. "The Build column" is otherwise ambiguous against `panel-build` (which does not scroll: scrollHeight equals clientHeight).
- In the scroll case, note that `scrollInstantly(page, 400)` returns 245 here. The asserted property is "greater than 0", as the ticket says, so no number should be pinned.
- A scratch probe spec existed only in the scratch checkout, which has been removed. No ticket, code or graph edits were made.
