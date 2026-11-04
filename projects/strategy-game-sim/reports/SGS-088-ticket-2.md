# SGS-088 ticket-2 (re-spec)

File: tickets/SGS-088-aoe4-workbench-ui-state-kept.md. Component aoe4-build-order, about 75 LOC, no dependencies, Risk standard.

Changes: Scope 2 now disables editor-view-text/table while shownTab is results (new BuildInput prop, e.g. viewDisabled) instead of jumping to Build; docs line and criteria updated. Scope 3 records the decision that any non-ok restore response drops the pin. Scope 1 merge rule: exactly one flag per parsed step, missing read as false, unparseable text leaves flags unchanged; criterion (c) adds length cases. Both owner Open questions deleted (now None). Re-spec section appended.

Diagrams: none required. Overlap: none new. No runnable search criterion changed (the docs grep is unchanged).
