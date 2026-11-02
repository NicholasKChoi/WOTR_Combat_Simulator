# SGS-046 re-spec 1

Source: designer pass 4, decision row 7, and design/M3.md (step table rows: defaultStep values, defaultTrigger values, time field; test-id table with `trigger-count`).

Changes to tickets/SGS-046-aoe4-step-table-editor.md (edited in place, id, file and graph row kept):
- Open questions 1 and 2 removed; section now reads "None."
- `step-field-trigger-count` confirmed: the "table-local name" note replaced by a reference to the design's test-id table.
- Time field: whole seconds, labeled "seconds", now stated as the design's rule.
- `defaultStep` and `defaultTrigger` values: already matched the design exactly (produce villager from villagerProducers[0]; pause; rally -> nodes[0]; build house from wood; research techs[0] no `at`; move 1 nodes[0] to wood; time 0, villagers 1, depleted finiteNodes[0], bank resources[0] 100); wording changed from "ticket's choice" to "fixed by the design".
- Scope and acceptance criteria otherwise unchanged. No command-based criteria changed, so no rerun needed.

Risk: high (unchanged; `lib/**` criticalPaths). Remaining open questions: none.
