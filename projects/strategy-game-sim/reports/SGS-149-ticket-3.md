# SGS-149 ticket 3 (re-spec 2)

File: tickets/SGS-149-test-hardening-masked-assertions.md. Lint clean.

Fix, per the gate's option (b). Scope item 3 now says the focus walk continues until the last chart's handle and caret are both seen. Handle-before-caret is asserted only with both indexes >= 0. A chart missing a stop is left to the stop-presence assertion. The Out of scope line allows only the walk's end-condition change. The caret-before-handle criterion is tagged (respec 2) and now covers the last chart, and a test must fail if handle-before-caret passes while either index is -1. A Re-spec 2 section was appended. No branch work existed.

Cause of the gap: I did not trace the walk's end condition against the mutation I asked for on the last chart.

No open questions, no diagram, no overlap.
