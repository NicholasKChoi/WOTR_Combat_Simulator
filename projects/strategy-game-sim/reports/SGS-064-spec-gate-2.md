# SGS-064 spec gate 2 (re-gate after re-spec 2 and 3)

Verdict: READY

Checked against branch tip 68e0ac1 (worktree) and origin/main 3ff99c6. I read the ticket, the implementer report, the acceptance spec, simulate.ts `finalStatus`, the README entries and the digest test. I did not run the acceptance suite.

## Your three questions

1. Step 23's waiting state. The Scope bullet says to keep `no waiting step` only if it still holds, otherwise assert `waiting`. This resolves to "keeps holding". `finalStatus` (simulate.ts ~905) sets `waiting` only when `armedAt !== null && startedAt === null` at the end of the run. Step 23 arms at 681 and starts at 687.55, so its final status is `completed` or `in-progress` at 1200 s and 3600 s. The `waiting` branch of the rule is dead. The implementer should keep `expect(steps.filter(s => s.status === 'waiting')).toEqual([])` and may add `armedAt: 681`, `startedAt: 687.5475028949656`. The 6.55 s wait appears in `waitSeconds`/`waitBreakdown.resources`, not in `status`. That is non-blocking, because the conditional plus "implementer states which" is enough to act on (see notes).
2. The 1200 s gold depletion test. It is unambiguous: `gold` `depletedAt` is about 1114.09 (the implementer pins the exact double), `gold#2` and `gold#3` are null, and `warnings` is exactly one `node-depleted` on `gold` with severity `info`. The implementer report says the same (info warning, 0 idle). The only thing left open is the exact double, which the ticket assigns to the implementer to measure on final code.
3. Numbers to re-measure. Scope names them: `startedAt` 687.5475028949656, the 1200 s `depletedAt` double, and digest `a0105e4a512765a0`. These are the values the implementer measured on 68e0ac1. The final code differs from 68e0ac1 only if rework changes it, so the ticket tells them to re-measure.

## Contradictions

None. The two shipped-build rules are consistent:
- The Scope "timing unchanged" test (line 51) allows a difference only "unless a pending item beyond the lead occurs in that run". That clause covers Spear/Longbow (King's Palace 543 to 680 s).
- Acceptance 86 asks for a report of changes. Acceptance 88 re-pins Spear/Longbow. Acceptance 89 requires 1TC and Knight/Longbow to be byte-identical, and the implementer report confirms this: all four fields plus the unchanged step-23 held warning on Knight/Longbow.
- Acceptance 81 (the filtered knight/longbow rises 660 to 764 s) filters the build in the test only, so the shipped file stays unchanged and is unaffected.
- The digest test already pins 1TC `e7f2436b024f722f` and Knight/Longbow `69e8496d68bb2946` unchanged, so the re-pin is limited to the Spear/Longbow row.

The other checks hold: grounded scope (acceptance spec constants `MAN_AT_ARMS_STEP` 23 and `CASTLE_LANDMARK_SECONDS` 681 exist), risk high (criticalPaths), invariants named, no open questions, no stale `pendingSupply` or doc sentences remain per the implementer's grep, and the docs and README edits are in the same diff.

## Notes (non-blocking)

- Scope (README Spear/Longbow entry) says to change "population 200 at 1366.43 s instead of 1373.04 s". `data/aoe4-build-order/README.md` quotes no such number (grep for 1373, 1366 and "200 at" finds nothing). The implementer correctly changed only the gold run-outs and the 681 s sentence. No action is needed. If the ticket is edited, reword it to "only if the README quotes it".
- The README still says the 681 s trigger is "hard-coded, so re-check it when an earlier step changes". The first half of its Transcription choices sentence ("the whole second after the King's Palace completes (680.3 s)") is still true. Nothing to fix.
- The Knight/Longbow README sentence (lines 81-83) is left false on purpose and is owned by SGS-065. The PR body should list it as a known leftover.
- The PR body must list every re-pinned test: the three acceptance tests and the digest row. Each re-pin needs a comment naming the lead-time rule, per the ticket. The acceptance spec carries no such comment yet, since it is unedited on the branch.
- Shipped-artifact hygiene: re-pin comments must state the rule ("houses now start on time while a long building is in flight") and not carry ticket ids.
