# SGS-169 ticket report 3 (re-spec 2)

File: tickets/SGS-169-effect-not-simulated-debug-severity.md. Lint passes.

Fixed the spec-gate gap. Scope now names each doc file with the stale statements, verified at origin/main:
- `docs/aoe4-build-order.md`: Severity section (severity sentence, `tech-effect-*` table row, closing "info behind a toggle" sentence). The `node-depleted` Results row stays true.
- `docs/aoe4-build-order-format.md`: Outputs `notes` bullet ("Every note has `severity: 'info'`") and the `warnings` bullet severity list.
- `docs/aoe4-build-order-ui.md`: Messages paragraph (info toggle) and the "other info notes are in the collapsed info list" sentence.
- `docs/api/openapi.json`: `Severity` enum and description, `BuildOrderNote` severity description. The `node-depleted` wording and the `severity: "info"` example stay valid.

The docs criterion is now: no file under `docs/` says research notes are info or that the page shows every message behind the toggle; docs describe `debug` and that the page hides it (respec 2). A `## Re-spec 2` section is appended.

Open questions: none. Diagrams: none. Overlap: none.
