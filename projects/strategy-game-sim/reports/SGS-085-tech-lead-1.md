# SGS-085 tech-lead 1

## Decision
APPROVE - draft PR opened.

- https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/99 - base `main` - head `sgs-085-aoe4-text-editor-issue-ux` @ 5f7a23c (pushed by this gate; it was not on origin before)
- PR body: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/reports/SGS-085-pr-body.md (set with `gh api -X PATCH`)
- Single PR, not stacked, so the body has no stack footer.

### Merge risk
**medium** - `toOrderIssue` in `schema.ts` builds the simulate route's 400 messages too. Those messages are unchanged and pinned by tests, but they now go through the new field-suffix branch. A revert fully undoes it.

### Review focus
- [`lib/aoe4-build-order/schema.ts:606-607`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/99/files#diff-d6dc7551ac06a7b81b7fba568c068b4b268bcf8ca3e62296c5031c1e4791558eR606-R607) - the route's 400 messages lose their ` in <field>` suffix if an issue with no paste line is treated as having one, and API consumers then see a different message - check that `where.line` is undefined for every JSON-sourced issue, including `start.*` - pinned by [`lib/aoe4-build-order/schema.test.ts`: orders field issues by civ, name, start, then each step in field order, then its cross-field issues](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/99/files#diff-943b7bdc5a7814639e79935570b73853ca65c66adf9b6d89d263b626d4778bedR182-R204) and its [`start.rally` message rows](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/99/files#diff-943b7bdc5a7814639e79935570b73853ca65c66adf9b6d89d263b626d4778bedR348-R354)
- [`lib/aoe4-build-order/text-to-build.ts:23-28`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/99/files#diff-c8f7eac99d6e04d0215946cb345d13db2a5ceb386984e405e7375b69286d6ca6R23-R28) - running the start or cross-step rules on a partial order would report false issues (`no start.rally`, a repeated research), and an unstable merge would scramble the list order - check the limited check and the line-less-first sort - pinned by [`lib/aoe4-build-order/text-to-build.test.ts`: lists the field issues of the parsed lines with the syntax issues in line order, puts issues without a line before the first line, skips the start and cross-step rules while a line fails to parse](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/99/files#diff-782783fb0402c8478d1278a4e57c8318a6e303fe2289676bb8b8597d9b95cf40R59-R92)

## Reviewed
- Range: origin/main 2a36296 .. 5f7a23c (4 commits, all authored choinickolas@gmail.com). Merge-base equals origin/main.
- 14 files, +232/-35 overall; reviewable business logic +49/-22 (schema.ts, text-to-build.ts, parse-text.ts, issue-list.tsx, workbench.module.css, pages/apps/aoe4-build-order.tsx). Also read the docs diff, unit tests and acceptance diff.
- Checked: INVARIANTS A1-A3 (engine untouched; no numbers, randomness or payment change), S1-S3 (no cross-app import, no new unbounded input). No criticalPaths symbol touched (`schema.ts` is not listed). The route (`pages/api/aoe4-build-order/simulate.ts:27`) calls `checkBuildOrder` without lines, so it always gets the ` in <field>` suffix: messages unchanged, pinned by schema.test.ts:182-204, :222, :348-354. The new 4th argument defaults to the old behavior. The other `parseBuildOrderText` consumers (`step-timeline-rows.ts`, the page's `parsed`) read only `ok`/`issues`/`order`, so the extra `partial` member on the failure variant is additive. No problem carries both `field` and `earlier` (`earlier` comes only from cross-step problems), so the suffix order cannot combine. The open question (Run stays enabled) was recorded in the ticket as reversible, and the step-less issues were the owner's answer (Q11), so nothing was decided unilaterally.

## Blockers
None. Untested hotspots: none (each Review focus entry is pinned by assertions on exact messages, codes and lines).

## Non-blocking notes
- `pages/apps/aoe4-build-order.tsx:178-181`: `rejection` is cleared only by a Run that converts. After a rejected Run, if the user edits the text until it has no issues and then breaks it again without running, the summary line comes back. This matches the ticket ("stays while `rejection` is set") and is harmless.
- `checkBuildOrder(value, catalog, lines, skipWholeOrderRules)` takes a positional boolean. It is fine with one caller, but an options object would read better if more flags get added.
