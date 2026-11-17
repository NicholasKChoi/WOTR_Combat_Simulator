## Summary
The AoE4 build-order page now says what a step waited for instead of a generic cause. The run cell's blocked-by text and the gutter popover's `Blocked by:` part read the result's `waitDetails` and `waitingFor`, so a step reads `50 gold 0:30` or `a free Archery Range 0:23` instead of `resources 0:30`. A `waiting` step lists its non-zero entries, then ends with `still waiting for <what>`. Example: `Castle Age 20:00, still waiting for Castle Age`. When the result has no `waitingFor` for the step, it falls back to `still waiting on <cause>`. A `not-reached` step still reads `not reached (<cause>)`.

Entries keep the order the result records them in, and zero-second entries are left out. The page builds all of this text from the simulation result through the shared `waitDetailText` wording and recomputes nothing.

Non-goals: no engine, API or OpenAPI change; the help modal, the long-wait and flag rules, and the `not reached` wording are unchanged.

## Merge risk
**low** - display text only: a revert fully undoes it, it touches no API, schema, CLI, config or critical engine symbol, and unit and acceptance tests pin the new text.

## Review focus
No hotspots: the change swaps the source of one display string from `waitBreakdown` to `waitDetails`/`waitingFor`. Every row of the wording rules (each status, zero-second entries, list order, both tails) is a row in the `StepRun` table in `step-annotations.test.ts`, and the acceptance spec checks the live text against the API result.

## Reviewer guide
Reviewable change: +16/-20 LoC (excluded: unit tests, the acceptance spec)
- [`components/apps/aoe4-build-order/step-annotations.ts`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/206/files#diff-8a65baadd7fafdcbb83ca131118327b0826e5ff69e54e389d8ba4b5104c20687) - `StepRun` drops `waitBreakdown` and gains `waits` and `waitingForText`. `formatWaitBreakdown` is deleted. `blockedByText` builds the text from them. Verify the `waiting` tail picks `for` only when `waitingFor` is set and that `not-reached` ignores the entries.
- [`docs/aoe4-build-order-ui.md`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/206/files#diff-c8ccc1c4fac60b1b37535ffc0e7ee18c3a62c7c297b7ce2f668a6a56613cf125) - the run-cell paragraph now describes the new wording rules in place of the old fixed cause order.

## Invariants and scope
The wait the page shows is still the engine's reported wait: the text comes only from the result's `waitDetails`, `waitingFor` and `waitingOn`. Long-wait and flag rules, stale dimming, alignment and the popover's `Waited` and `Still waiting` forms are unchanged.

<!-- cf-stack -->
### Stack

Merge bottom-up (this PR marked `->`):

- -> #206

🤖 Generated with [Claude Code](https://claude.com/claude-code)
