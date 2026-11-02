# SGS-049 re-spec 1

Source: M3-designer-4 decision 1c. formatMinSec lives in lib/aoe4-build-order/format-time.ts (moved by SGS-035, no re-export).

Changes to tickets/SGS-049-aoe4-chart-markers-ui.md (in place):
- Depends on: added SGS-035.
- Scope 1: markerLabel imports formatMinSec from ../../../lib/aoe4-build-order/format-time, not chart-rows; label wording (`<label> <m:ss>`) unchanged.
- Acceptance: first criterion checks the import path.

Risk: standard (unchanged). Open questions: none.
