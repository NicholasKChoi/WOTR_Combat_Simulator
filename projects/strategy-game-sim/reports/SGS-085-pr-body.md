## Summary
Makes the AoE4 build order text editor's issue list easier to act on.

- **Gutter mark:** the line number of a line with an issue is now bold and red (`var(--bs-danger)`). The `data-error` attribute was already set, but no CSS rule used it.
- **Wording:** paste messages no longer end with the JSON field name. `line 2: unknown unit "knigt" in unit` now reads `line 2: unknown unit "knigt"`. `checkBuildOrder` adds ` in <field>` only to an issue that has no paste line, so the simulate route's 400 messages (`steps[0]: unknown unit "knigt" in unit`) do not change. A suggestion now follows the message after `. ` and reads `Did you mean knight?`.
- **All lines at once:** when a pasted line fails to parse, `parseBuildOrderText` also returns the lines that did parse as `partial`. `textToBuildOrder` checks those lines with `checkBuildOrder(..., skipWholeOrderRules = true)`, which runs the field checks and each step's cross-field rules but skips the `start` rules and the rules that compare steps. The result lists those issues with the syntax issues at once: issues without a line come first, then the rest in line order (stable sort). On a parse failure these check issues carry `line` but no `step`, because a step index would point into a partial order the caller never sees. A text that parses behaves as before: its check issues appear from the first Run on.
- **Run with issues:** after a Run that the text cannot convert, the issue list starts with `Fix N issues to run the simulation.` (`Fix 1 issue ...` for one). The count follows edits, and the line goes away after a Run that converts. Run stays enabled and still sends nothing.
- `docs/aoe4-build-order.md` is updated to match: Node references, Issues, the `t2b` flowchart node, and the page paragraph.

Non-goals: no debounce, no disabled Run, no change to route (JSON) messages or `docs/api/openapi.json`, no table view change, and other messages that name JSON fields (`count: 0 is outside 1..200`) are left as they are.

## Merge risk
**medium** - `toOrderIssue` in `schema.ts` builds the simulate route's 400 messages too. Those messages are unchanged and pinned by tests, but they now go through the new field-suffix branch. A revert fully undoes it.

## Review focus
- [`lib/aoe4-build-order/schema.ts:606-607`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/99/files#diff-d6dc7551ac06a7b81b7fba568c068b4b268bcf8ca3e62296c5031c1e4791558eR606-R607) - the route's 400 messages lose their ` in <field>` suffix if an issue with no paste line is treated as having one, and API consumers then see a different message - check that `where.line` is undefined for every JSON-sourced issue, including `start.*` - pinned by [`lib/aoe4-build-order/schema.test.ts`: orders field issues by civ, name, start, then each step in field order, then its cross-field issues](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/99/files#diff-943b7bdc5a7814639e79935570b73853ca65c66adf9b6d89d263b626d4778bedR182-R204) and its [`start.rally` message rows](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/99/files#diff-943b7bdc5a7814639e79935570b73853ca65c66adf9b6d89d263b626d4778bedR348-R354)
- [`lib/aoe4-build-order/text-to-build.ts:23-28`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/99/files#diff-c8f7eac99d6e04d0215946cb345d13db2a5ceb386984e405e7375b69286d6ca6R23-R28) - running the start or cross-step rules on a partial order would report false issues (`no start.rally`, a repeated research), and an unstable merge would scramble the list order - check the limited check and the line-less-first sort - pinned by [`lib/aoe4-build-order/text-to-build.test.ts`: lists the field issues of the parsed lines with the syntax issues in line order, puts issues without a line before the first line, skips the start and cross-step rules while a line fails to parse](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/99/files#diff-782783fb0402c8478d1278a4e57c8318a6e303fe2289676bb8b8597d9b95cf40R59-R92)

## Reviewer guide
Reviewable change: +49/-22 LoC (excluded: unit and acceptance tests, docs)
- [`lib/aoe4-build-order/text-to-build.ts`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/99/files#diff-c8f7eac99d6e04d0215946cb345d13db2a5ceb386984e405e7375b69286d6ca6) - on a parse failure, runs the limited check on the partial order, drops `step`, and merges by line - verify the line-less-first stable order
- [`lib/aoe4-build-order/schema.ts`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/99/files#diff-d6dc7551ac06a7b81b7fba568c068b4b268bcf8ca3e62296c5031c1e4791558e) - `field` on `Problem` and the issue params, the suffix only without a paste line, `skipWholeOrderRules` with its own schema cache - verify the default path is unchanged
- [`lib/aoe4-build-order/parse-text.ts`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/99/files#diff-f15b3276097f911e62c7bc49dd49b2f950abcd30958d1fed32c722a33f86c219) - the failure variant now carries `partial: { order, lines }` - verify `issues` are still the syntax issues only
- [`components/apps/aoe4-build-order/issue-list.tsx`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/99/files#diff-9e4e151e19371590b1044b65fa4da9fd63d3dd19f129c324910609e1501dfc12) - the `. Did you mean <id>?` join and the rejected-Run summary
- [`pages/apps/aoe4-build-order.tsx`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/99/files#diff-aea44dd8df67afd590f57f83436ad63a0375df14a7656d7660754745f759188b) - clears `rejection` on a Run that converts and passes `rejected` to the list
- [`components/apps/aoe4-build-order/workbench.module.css`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/99/files#diff-6b0f7f80fc6f1e2c49c64fa638b0bfca12c30d9e945da107d700cd591c53e678) - the gutter error rule

## Invariants and scope
Invariants touched: none. The simulation engine, payment checks, the simulate route's request and response shapes, and the OpenAPI document are unchanged. `checkBuildOrder`'s new fourth argument defaults to the previous behavior.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
