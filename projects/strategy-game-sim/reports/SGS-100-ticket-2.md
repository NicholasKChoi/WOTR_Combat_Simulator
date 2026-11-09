# SGS-100 ticket 2 (re-spec)

File: tickets/SGS-100-auto-run-controller.md, re-specced in place.

Folded in: spec-gate-1 gaps 1 to 3 and the smaller points, via the amended design rows. Scope restates the abort definition (abort, clear inflightKey, bump seq), rule 4 aborting in-flight (as a guard), the rejectedKey lifetime with both samples, staleness after post and after body read, create never calling onChange, unrequested AbortError -> failed, and retry. Criteria added: rejectedKey lifetime (two cases), body read dropped (edit or dispose, 200 and 400), create calls no onChange, unrequested AbortError. "Exactly" removed from exports. The spec-gate's rule 4 in-flight case was not added as a test: with the lifetime rule it is unreachable, so Scope marks the abort as a guard. useAutoRun is SGS-102's, left alone. Change-log entry `## Re-spec 2026-11-09 (2)` appended. No open questions, no overlaps. Size unchanged (~220). Diagram unchanged.
