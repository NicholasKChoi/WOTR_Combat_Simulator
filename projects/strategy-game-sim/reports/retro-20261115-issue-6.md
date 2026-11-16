Comment on existing issue #67 (batch gate: simplify agent reviewed the diff by hand instead of
running /simplify). Not a new issue.

---

This is the default behavior, not a one-off. Across every simplify report in WOTR_Combat_Simulator's
`projects/strategy-game-sim/reports/batch-*-simplify-1.md` (17 files, 2026-10-29..11-15), only
`batch-SGS-156-SGS-156-simplify-1.md` records the skill ("Ran the /simplify skill (Skill tool available)
with 4 parallel agents"). The other 16 describe a hand review: "reviewed diffs; no trims warranted",
"Simplify was run inline per branch", or a list of edits. In the M9-close window it is 5 of 6 (batches
SGS-133-135, SGS-137-139, SGS-142-152, SGS-157, SGS-158).

A related failure: run-20261112-2038 20:52, "simplify agent had no CLAUDE_PLUGIN_ROOT, so run.sh
unavailable". The batch-gate simplify is a general-purpose agent, so it does not get the plugin
environment the named agents get. If the fix makes it a named `code-factory:simplify` agent, that
closes both.

This supports the proposal's check: a simplify report without the skill's summary line is a failed
gate, and the manager relaunches it.

Source: retro 2026-11-15, pattern 6 (`.claude/code-factory/projects/strategy-game-sim/reports/retro-20261115.md`).
