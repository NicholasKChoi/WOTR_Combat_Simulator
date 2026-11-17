# SGS-200 spec gate, round 2

Verdict: NEEDS_SPEC

Read at origin/main (87f0cd7). M11 code does not exist yet, so new files were checked against design/M11.md and the Depends-on tickets (SGS-190..199). Round-1 gaps (lib README, stale-phrase searches) are fixed in the re-spec. Two overlap gaps remain.

## Gaps

1. **Scope "Wait text" bullet and acceptance criteria 4 and 66 (overlap with SGS-193) - SGS-200 rewrites the run-cell wait sentences that SGS-193 now rewrites in the same file - two tickets would edit the same sentences (throwaway work or a merge conflict), and criterion 4 (`in that order`) is owned by SGS-193's own criterion.**
   - SGS-193 Scope "Docs (respec 1)" rewrites the run-cell paragraph of `docs/aoe4-build-order-ui.md` (the `<cause> <m:ss>` "in that order" sentence and the `still waiting on <cause>` sentence) and has a criterion that `git grep -n "in that order"` matches no wait sentence. It lists "the rest of docs/aoe4-build-order-ui.md" as SGS-200's.
   - SGS-200's bullet says these sentences "are rewritten to the B-W10 table". SGS-200 depends on SGS-193, so at its start they are already rewritten.
   - The bullet also says the gutter popover sentence ("what blocked it", `Still waiting. Blocked by: ...`) is rewritten. At origin/main that sentence (UI doc line 20) does not quote wait cause text, and SGS-193 keeps the `annotationDetailText` forms (`Still waiting. Blocked by: ...`), so it stays true. Nothing to rewrite there.
   - Proposed fix: change the bullet to "Check, do not rewrite, the run-cell wait sentences and the popover sentence (SGS-193 owns them, as SGS-190..192 own their doc edits): confirm they agree with `waitDetailText` and the B-W10 rules; fix only a sentence still untrue after SGS-193 (for example another sentence quoting the old text)." Criterion 4 becomes a check ("no match of `in that order` in a wait sentence at the integrated end state") with no edit implied. Criterion 66 keeps its report content (quote the sentence and the code) but is a verification, not a rewrite. If SGS-193's open owner question (table versus design for the `waiting` step) is answered after this ticket starts, the check follows SGS-193's as-built text.

2. **Scope "Chart series table row 'Units produced (Units view)'" and criteria 1 (`tier <tier>`) and 5 (`unitId`) (overlap with SGS-198) - SGS-198 already rewrites that row; SGS-200 says "Rewrite the row" again - an implementer would rewrite text already rewritten, or conflict with it.**
   - SGS-198 Scope "Docs" and its criterion rewrite the row (key `baseId`, name `lineName`, tiers summed, per `unitLineSeries`) and leave "the dot description and the sentences around the table" to SGS-200. SGS-200 depends on SGS-198.
   - Proposed fix: in SGS-200 say the row is SGS-198's; this ticket checks it against the code and rewrites only what SGS-198 left: the sentences around it (Buildings view comparison, "pinned run follows the view ... matched by key", the legend naming rule) and the upgrade-dot description. Keep the `tier <tier>` and `unitId` searches as end-state checks.

## Checks that passed

- Grounded: the quoted stale sentences exist at origin/main in `docs/aoe4-build-order-ui.md` (line 20 legend sentence and popover sentence, lines 99 and 102-104, row at 114, marker legend lines 132-140, Chart controls 147-149, Key results row 167-173). `ARCHITECTURE.md` line 6 holds "It does not list every file", and the lib README has `engine-common.ts`, `research.ts` and `markers.ts` entries as described.
- Overlap with SGS-195 is fine: it fixes only the statements its change makes untrue, and SGS-200 re-reads the marker paragraph and completes B-M1..10 ("leftover"). SGS-194 leaves the title-row sentences true and defers the table prose here. SGS-196, SGS-197 and SGS-199 defer all doc edits to SGS-200, including the two kind-legend sentences (consistent with SGS-200's legend bullet).
- Criteria are observable searches over doc wording (allowed), each end-state-correct; the rule-to-location map is report content. No pinned counts or closed lists.
- On merge: one `; `-style list with no trailing prose. Invariants A3 listed, no contradiction. Risk low is right (docs only). Unverified assumptions none is right. Open questions none. Diagrams not required. Input validation not applicable. Dependencies stated (SGS-194..196 are ancestors of SGS-197/198).
- ARCHITECTURE.md scope is limited to the three files that carry a rule; the "does not list every file" sentence is kept.
- Docs-only: no code, so no new-rule or mutation checks.

## Notes (non-blocking)

- SGS-193 and SGS-198 carry open owner questions or are `needs_spec`; SGS-200 cannot start until they merge, which its Depends-on already enforces.
- After fixing gap 1, "Re-read the rest of the page ... `wait`" in the final Scope bullet still covers any other sentence quoting old wait text.
