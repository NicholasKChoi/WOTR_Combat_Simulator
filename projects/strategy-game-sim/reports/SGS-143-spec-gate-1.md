# SGS-143 spec gate 1

Verdict: READY. Risk tier confirmed: low.

## Checks (read at origin/main after git fetch)

1. Grounded scope: `.runBar` and the `@media (min-width: 768px)` rule exist in `workbench.module.css`. That rule has `max-height: 40dvh` and `overflow-y: auto`, and no `scroll-padding-block`. `use-run-bar-height.ts` writes the property with `Math.ceil(rect.height + margin)`. The split height is `calc(100dvh - var(--aoe4-run-bar-height, 0px))`. `acceptance/aoe4-split-scroll.spec.ts` exists and its checks use a 1px tolerance, as the ticket says.
2. Criteria are observable. I checked the sticky-bar reasoning: with ceil the variable exceeds the real height, so max scroll falls short of the bar's offset by the fraction. Floor or no rounding fixes this. The existing "run bar height property follows the bar" test allows a 1px difference and still holds. Scope's rule for existing tests ("other tests keep their assertions", tighten the tolerance only if it still passes) covers that tolerance. No search criteria over code. Nothing quotes a stale number or list.
3. The one open question (`overflow-anchor` at narrow and tabs widths) is edge behavior, and the ticket says it is unchanged here.
4. Invariants `none` is correct: A1 to A3 do not cover CSS or layout hooks.
5. No new contracts. `--aoe4-run-bar-height` is unchanged.
6. No dependencies, about 15 LOC.
7. No diagram trigger.
9. On merge is `none`.
10. Risk low is right: no criticalPaths symbol and no strongModelTrigger.
11. No doc states ceil, a focus ring or scroll padding. The docs at line 881 and in the narrow-layout paragraph stay true.
12. No input at a trust boundary.
14. Overlap: SGS-144 (rem basis) edits the container-query thresholds in `workbench.module.css` and the `rem` values. It does not touch `.runBar` or the hook, so there is no throwaway work. Merge conflicts are possible but small.
15. Unverified assumptions are listed and cover the happy path.

## Notes (non-blocking)

- "about 0.25rem": the root font is 18px, so this is 4.5px. A Bootstrap focus ring is a 0.25rem box-shadow spread, so the number fits. The criterion should assert the real property: the focused control's rect expanded by its ring spread (read from computed `box-shadow` or `outline`) sits inside the bar's scrollport. Do not hard-code a pixel value in the test.
- Criterion 1 needs a bar tall enough to overflow the 40dvh cap at 768 px or wider. The implementer picks the setup, for example a short viewport or an error message that wraps. The test should first assert `scrollHeight > clientHeight` on the bar so it cannot pass vacuously.
- Criterion 2 should force a fractional height, for example by setting a fractional font size on the bar or by adding an element of fractional height. The test should first assert that the bar's rect height is not an integer.
