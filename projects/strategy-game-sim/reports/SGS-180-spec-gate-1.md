# SGS-180 spec gate 1

**Verdict: READY**

Checked against origin/main (fetched). SGS-179 is not integrated yet; its ticket adds `MIN_SUPPORTED_VIEWPORT` = `{ width: 1200, height: 800 }` to `acceptance/helpers.ts` and keeps `SPLIT_MIN_WIDTH`, `TABS_VIEWPORT` and `showTab`. This matches design/M10.md C5 and the SGS-180 usage. The Depends-on is stated.

## Findings

- Grounded scope: every named case, constant and helper exists at base.
  - split-layout: "split at 1280", "tabs at 390", the 1200 breakpoint case, the live-switch case, both round trips, the view-toggle case, first paint, and the resize describe with 2 rows.
  - split-scroll: the below-1200 case, `NARROW_VIEWPORT`, the below-768 case, the headings `tabs` row, the 768x1024 focus-ring case, and `showTab` in `openLongBuild` and the headings case.
  - results-split: the `tabs` row and `showTab` in `openResults` and the "no steps" case.
- I re-grepped the three files for tab names and viewports. The only sub-1200 viewports are 390, 1199, `TABS_VIEWPORT` (1024), 700 and 768, and all are covered by Scope.
- I found no other viewport or tab hit. `aoe4-split-tab-order` has none.
- `SHORT_VIEWPORT` is 1280x720 and the Playwright default is 1280x720 (no viewport in the config), so both are allowed by the "no viewport under 1200" rule.
- No file outside the three specs references them by name, so no doc is made stale.
- Kept "split at 1280": the `scrollWidth` helper is still used, so Scope's "if nothing kept uses it" wording is correct.
- The deletions agree with design/M10.md rows 84-92. The first-paint server-render case is deferred to a later ticket, which the design allows as a rewrite owned elsewhere.
- Criteria are behavioral and checkable. Removal is proven by typecheck and spec run, not by a search over code. Test-dependency scan: only these spec files and helpers are affected; helpers are untouched.
- Risk is low and test-only. Invariants are none. Open questions are none. On merge is none. Unverified assumptions are none, which is correct because the specs run against the real page.
- Overlap with SGS-184: it removes the helpers after this ticket and no spec reference remains, so there is no throwaway work.

## Notes (non-blocking)

- "`npm test` is unchanged" in the last criterion is loose. "No unit test file changes" would be sharper.
- I did not run the moved focus-ring case at 1200x800. The criterion requires the implementer to run it. If it fails at 1200, that is a real finding, not a spec gap.
- Deleting "first paint ... no hydration warning" leaves no hydration-warning check until the later server-render ticket lands. The ticket states this.
