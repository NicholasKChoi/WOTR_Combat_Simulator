# SGS-045 spec gate 1

Verdict: READY

Checks (1-12): all pass.
- Grounded: results.tsx:8 notes alert, page `Results` call (line 95), docs/aoe4-build-order.md:570-571, spec tests at :170-184, vitest include for components/**/*.test.ts all exist as described. messages.ts/.tsx are marked new. Severity, SimWarning, warnings (SGS-037) and BuildOrderNote.severity (SGS-041) come from dependencies and match design/M3.md.
- Testable: every criterion has an observable outcome (test ids, texts, aria-expanded, counts, grep).
- Open question (error-severity handling) is edge only, explicitly unhandled, no criterion depends on it.
- Contracts: ResultMessage, resultMessages, test ids, toggle texts and collapse/persist rules match design/M3.md "Page props and test ids", "Result messages" and Behavior rows.
- Invariants: none adjacent; no game number added. Risk standard is right (no criticalPaths, no trigger).
- Docs: stale sentence is in Scope 6; grep found no other `simulation-notes` or `notes list` mention in docs/.

Notes (non-blocking):
1. Scope 5 unit-test phrase "ignores nothing of warning/info severity" is unclear. Suggest: "every warning and note of severity warning or info appears in exactly one list".
2. The old React key was `${step}-${code}`; ResultMessage has no step. The implementer should key by list index or code plus index. Messages can repeat codes.
3. The patched-response test's `warnings` entries must be valid SimWarning shapes (for example a `node-depleted` with severity warning, and one with severity info). The ticket does not give literals, but the types make this derivable.
4. SGS-047 (adds `text` prop) and SGS-048 (adds `pinned`) also edit Results props and the page call; they are siblings, not dependencies. Expect a mechanical rebase conflict in results.tsx and the page.
5. The "no info" assertion for RALLY_PASTE relies on SGS-038 behavior (idle sheep warning) or on the empty warnings before it. It holds either way.
