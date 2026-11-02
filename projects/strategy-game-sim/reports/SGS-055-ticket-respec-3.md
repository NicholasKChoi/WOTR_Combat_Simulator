# SGS-055 ticket re-spec 3

Source: reports/SGS-055-spec-gate-1.md (NEEDS_SPEC, one gap).

- Underspecified: Scope flow step 4 and its acceptance criterion said 3 `step-timeline-row` and named the not-reached row `data-step="2"`; FLOW_PASTE is one `start` line plus two steps, and `start` is not a step.
- Changed: Scope step 4 and the AC (tagged `(respec 3)`) now say 2 rows; row `data-step="0"` completed, not flagged, contains `x5`; row `data-step="1"` (`@25:00`) `not-reached` with `data-flagged="true"`. No other section referenced 3 rows / row 2.
- Still stands: everything else (helpers move, reaction and table-unavailable tests, mutation checks, open question). No branch work exists yet.
