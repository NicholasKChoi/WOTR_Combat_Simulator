# SGS-088 spec gate 2

Verdict: READY. Risk `standard` confirmed.

Both gate-1 gaps are closed: the Text/Table and 5xx choices are recorded in the body with no Open questions left, and Scope 1 now gives the external-edit merge (one entry per parsed step, missing entries read as false, unparseable text leaves flags) with matching unit cases.

## Checks
- Grounding: `expansion` state at step-table.tsx ~292, `moveStep`/`deleteStep`/`insertStep`/`hasOptionalField` in step-table-model.ts, restore effect and `pinTouched` in the page, `BuildInput` (`onTextChange` via `selectBuild`, `onViewChange`), `BuildTextEditor.onChange`, `showView` helper and the `[400,false],[500,true]` pin-compare table (line ~496) all exist as described. Both text setters are plain `setText` on the page, so the wrapper mechanism is feasible.
- Criteria: observable (`aria-expanded` on `step-more`, `toBeDisabled`, stored key, POST track). Numbers in unit cases are inputs, not stale counts. Existing-test rule is in Scope 5.
- Open questions / decisions: none left; owner answers recorded.
- Invariants: none adjacent is right (A1-A3 not touched). Contracts: no schema/API change. Depends-on none is right.
- Size: about 70 LOC. Diagrams: none required. LESSONS: no match (no layout rects asserted).
- Docs: the three stale statements (docs/aoe4-build-order.md ~819, 846-849, 907) are in Scope 4 with a grep criterion. README.md and ARCHITECTURE.md have none.
- On merge: the BACKLOG bullets and the M4 design row (design/M4.md line 532) are named as manager follow-up.
- Input validation: not applicable.
- Risk: no strongModelTriggers or criticalPaths hit; standard is right.

## Notes (non-blocking)
- Existing specs that call `showView` (m3-flow, client-check, inline-issues, narrow-layout, step-table, aoe4-build-order.spec.ts) were spot-checked. Each runs from the Build tab or goes through `showTab(page, 'build')` first, so the disabled toggle on Results should not break them. The implementer should still run the whole acceptance suite; `aoe4-build-order.spec.ts` stays in the run until deleted and cannot be edited under Scope 5.
- docs/aoe4-build-order.md ~858 says "the toggle stays usable" while text is unparseable. Still true on Build; add "on the Build tab" while editing that paragraph.
- Ticket cites `cc9bb04`; main is now `ee7ecb9`. The cited code is unchanged as read.
