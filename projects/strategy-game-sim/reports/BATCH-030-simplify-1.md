# BATCH-030 simplify pass 1

- /simplify invoked via the Skill tool: yes. I did not spawn the four sub-agents; I ran the reuse, simplification, efficiency and altitude angles inline over `git diff dbe695f` (simulate.ts, civ-rules.ts, docs, tests).
- Changes made: none. No commit.
- Declined:
  - Three repeated `{ food, wood, gold, stone }` zero initializers (income, gatherRates, floating): a shared helper saves little and adds a name.
  - Nested ternary comparator in `unitSeries`: swapping to `localeCompare` could change ordering for ids.
  - Per-call `{ ...ruleContext(state), ... }` spreads and sorted-insert `schedule`: only run at event frequency, so the cost is trivial.
  - `StepHandler` / `stepHandlers` / `schedule` / `CivRules` / exported names and signatures: all kept exactly because SGS-031/032 depend on them.
  - Comments: already at the bar; none reference ticket ids.
- `npx tsc --noEmit`: clean. `npm test`: 20 files, 555 tests passed.
- Final tip: 796bf6e580b19bb46525cec58c73683767222131 (unchanged), on branch sgs-030-aoe4-engine-core. Not pushed.
