# SGS-169 spec gate 1

**Verdict: NEEDS_SPEC**

Read at origin/main (after `git fetch origin`). No dependencies.

## Gaps

1. **Docs scope names the wrong files (check 11, check 2).**
   - Scope puts the `notes` bullet in Outputs ("Every note has `severity: 'info'`"), the `warnings` bullet's severity list, and the Page paragraph on the info toggle in `docs/aoe4-build-order.md`.
   - They are in other files on origin/main:
     - `docs/aoe4-build-order-format.md` ~line 409 (`notes` bullet: "Every note has `severity: 'info'`") and ~line 419 (`warnings` bullet: "one of `error`, `warning`, `info`").
     - `docs/aoe4-build-order-ui.md` ~lines 144-148 (Messages paragraph: `info` messages behind a toggle "Show N info messages").
   - `docs/aoe4-build-order.md` itself only has the Results table row for `node-depleted` (~line 440, still true), the Severity section (lines 447-461), and the `tech-effect-*` row (line 458).
   - The acceptance criterion on docs names only `docs/aoe4-build-order.md` and `docs/api/openapi.json`, so an implementer following the criterion leaves the format doc and UI doc stale.
   - Proposed fix: list the three doc files (`aoe4-build-order.md`, `aoe4-build-order-format.md`, `aoe4-build-order-ui.md`) in Scope with the statements above placed in the right file. Rewrite the criterion as: no file under `docs/` says research notes are `info`, or that the page shows every note or every non-warning message behind the info toggle. The docs describe `debug` and say the page hides it. A grep over `docs/` for `severity: 'info'`, "every note is info" and "info messages" is fine here because it covers doc wording.
   - Also add to the openapi bullet the `Severity` description ("No result item is error today..."), which the ticket already mentions, plus the `node-depleted` wording, which is still true and needs no change.

## Checked and fine

- Grounded scope:
  - `model.ts` `Severity` and `SEVERITIES` exist.
  - `research.ts` `researchNotes` sets `severity: 'info'` at two literals.
  - `messages.ts` `resultMessages` already ignores severities other than `warning` and `info`, so the filter amounts to the type change plus keeping the guard.
  - `results.tsx`, `message-lists.tsx` and the `InfoMessages` toggle exist. `InfoMessages` returns null on an empty list, so the "only debug notes" criterion is satisfiable.
- Existing tests that pin old behavior are covered by Scope:
  - `research.test.ts` lines 645 and 650.
  - `model.test.ts` line 35.
  - `acceptance/aoe4-simulate-api-research.spec.ts` line 37.
  - `messages.test.ts`.
  - `inline-issues.spec.ts` line 196, which counts infos from `warnings` plus `notes`.
  - `aoe4-simulate-api-edges.spec.ts` line 72 asserts no severity, so it is unaffected.
  - `data.acceptance.test.ts` pins export lists, which the ticket does not change.
- Page specs (`m4-flow`, `knight-longbow-page`) filter on `node-depleted` and are unaffected.
- Open questions are none, consistent with Q105. Risk `standard` is right: no critical path or strongModelTrigger is touched. Invariant A3 is named. `On merge: none` and `Unverified assumptions: none` are fine. No diagram trigger. Size is well under 400 lines. No input-validation change. No overlap with other tickets was found.

## Notes

- The ticket cites LOC estimate "`messages.ts` filter". Today's filter already drops `debug` once the type widens, since `resultMessages` guards on `warning` or `info`. A test with a `debug` note is still needed, as the criteria say.
- The `docs/api/openapi.json` line ~1798 example (`severity: "info"` on `node-depleted`) stays valid.
