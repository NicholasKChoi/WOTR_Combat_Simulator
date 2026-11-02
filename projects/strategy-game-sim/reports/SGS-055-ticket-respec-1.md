# SGS-055 re-spec 1

Folded in designer pass 4 decision row 7 and the existing SGS-046/047 tickets (edited in place, no notes section).

- Context: states the final ids. `step-field-count` is the action count, `step-field-trigger-count` is a `villagers` trigger's count, and `step-field-seconds` takes whole seconds (labeled "seconds"). The flow test uses `step-field-count` only. SGS-046 and SGS-047 keep the design ids.
- Flow step 2: SGS-046 number fields commit on a valid draft, so a plain `fill` is enough (blur only restores the display). The "blur or Tab" hedge is removed.
- Removed the open question about SGS-046/047 ids and commit behavior. Kept the open question about ENG 1TC gold running out near 3305 s (still true; SGS-039 measures it).
- Risk stays standard. Scope, criteria and dependencies are unchanged. No criterion with a command changed, so no re-run was needed.
