# Tech-lead gate: batch M3 wave 1

## Decision
No blockers. Four draft PRs opened (stacks: 053 <- 036; 035; 052). Footer stacking on the 053/036 stack only.

## PRs (bottom to top within each stack)

### SGS-053 - https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/42 (base main, tip 9998b4f)
## Merge risk
**low** - documentation only; a revert fully undoes it and no code, API or config changes.

## Review focus
No hotspots: prose-only change to one design doc; nothing executes it.

### SGS-036 - https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/43 (base sgs-053-aoe4-m2-doc-wording, tip b83701a)
## Merge risk
**medium** - changes a public API response (`SimulateError`): `issues` is now capped and `omittedIssues` is new, but the field is optional, the only consumer (the page) is updated here, and a revert undoes it.

## Review focus
No hotspots: the cap is pinned at 100, 101 and 120 issues (including the order-then-inputs split), the schema check rejects 101 issues and `omittedIssues: 0`, and the parser and validator changes each have a test that fails when the change is reverted.

### SGS-035 - https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/44 (base main, tip b52e9f5)
## Merge risk
**medium** - changes the critical payment symbols (`canAfford`, `payCost`, and their callers in the event loop), but the route output is byte-identical on 15 requests and pinned by timeline tests, no public surface changes, and a revert undoes it.

## Review focus
- [`lib/aoe4-build-order/research.ts:35-39`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/44/files#diff-6dea0adf30bf11d9accf8e7e324e7d858172051b5845ec1a4cbae0e47c1be4d4R35-R39) - research affordability margin narrows from about 1.5e-8 to 1e-9; a research whose bank drifts just under its cost now waits for the next wake instead of starting, and would stall if no wake re-offers it - check that `affordableAt` (same 1e-9 margin) always schedules a wake for that shortfall. The route cannot observe sub-1e-8 margins, so only the unit test pins this.
- [`lib/aoe4-build-order/houses.ts:23-25`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/44/files#diff-47538e8438ee180a1c60c3d9544f464bfcadb553ff38c244e9ff9860d58af8b7R23-R25) - the auto-house planner now ignores a projected population shortfall up to 1e-9; if a real shortfall ever rounded into that band, a house would start one wake late and supply could block production - check the band is only float noise. Pinned by a unit test, not by the route.

### SGS-052 - https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/45 (base main, tip 0dd2411)
## Merge risk
**low** - one display prop; a revert fully undoes it, it touches no public surface or critical path, and the new Playwright test pins the layout.

## Review focus
No hotspots: a single layout prop on the chart axis, with no logic; the overlap test covers every chart.

## Reviewed
- Base origin/main f078c11. Branches were local only; pushed unchanged (tips match the manager's SHAs), no new commits.
- SGS-053: origin/main..9998b4f, docs/aoe4-build-order.md, +18/-12.
- SGS-036: 9998b4f..b83701a, 13 files +182/-27 (code +20/-8; docs/OpenAPI +27/-13; rest tests/specs). Read route, api.ts, parse-text, validate, page, openapi diffs in full.
- SGS-035: origin/main..b52e9f5, 26 files +2166/-664 (engine code +108/-104; config/docs +14/-1; test-helpers 103; tests, specs, lockfile excluded). Read every non-test hunk; lockfile changes are additive jscpd dev deps (fsevents hunk is a reorder only).
- SGS-052: origin/main..0dd2411, line-chart.tsx +1/-1 plus Playwright test.
- Stack check: 053 diff vs main and 036 diff vs 053 each contain only their own task; 035 and 052 are single commits-sets off main.
- Cross-stack: git merge-tree of 036+035, 036+052, 035+052 all merge without conflicts (035 and 052 touch different hunks of line-chart.tsx; 035 and 036 different hunks of parse-text.ts). jscpd 4.3.0 with .jscpd.json on the merged 036+035 tree: 0 clones.
- Invariants: S3 strengthened by 036 (issue cap). A2 kept (payCost clamp, canAfford margin; tolerances only narrowed or below 1e-9). A3 kept (no clock/random). A1 kept. S1 kept (format-time.ts lives in lib/aoe4-build-order, imported by the same app's component). CONTEXT.md open questions: none.

## Non-blocking notes
- 035 `lib/aoe4-build-order/simulate.ts` ~line 92: removing `type Resources` left two consecutive blank lines (style only).
- 036 adds a public-schema change (`omittedIssues`, `issues.maxItems`); SimulateError keeps `additionalProperties: false`, so any strict external client validating against the old schema would reject a capped 400. The page is the only known consumer and is updated in the same PR.
- On 035 merge the manager sets REPO.md commands.lint to `npx tsc --noEmit && npm run lint:dup` (not done here).
