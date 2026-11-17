# SGS-200 spec gate, round 1

Verdict: NEEDS_SPEC

Read at origin/main (87f0cd7 era; the M11 code does not exist there yet, so new files were checked against design/M11.md Modules and the Depends-on tickets).

## Gaps

1. **Scope / Acceptance (only docs/** and ARCHITECTURE.md change) - the module index for lib/aoe4-build-order is `lib/aoe4-build-order/README.md`, which no M11 ticket updates, and the ticket forbids touching it - an implementer would either put six file descriptions into ARCHITECTURE.md against its own header or leave the README stale.**
   - `lib/aoe4-build-order/README.md` lists every engine file with what it owns ("Types and data", "The engine": `engine-common.ts`, `research.ts`, `markers.ts`, ...) and describes the event loop. M11 adds `wait-detail.ts` and `unit-lines.ts`, adds `instanceFree` to `engine-common.ts`, and changes how steps wait, so it goes stale.
   - A grep of SGS-190..199 for `lib/aoe4-build-order/README` finds only SGS-190's data README, not the lib README. SGS-192 and SGS-193 push docs to "the docs ticket", which is this one, and this ticket does not name it.
   - ARCHITECTURE.md says "It does not list every file; use `git ls-files`". It describes only seams with a rule (storage, route logic). The ticket's Scope and criterion 6 force six lib and component files into it, including `chart-zoom.ts` and `use-chart-zoom.ts`, which have no import rule to state.
   - Proposed fix: add `lib/aoe4-build-order/README.md` to Scope (entries for `wait-detail.ts` and `unit-lines.ts`, `instanceFree` under `engine-common.ts`, a re-read of the event-loop and "where the pieces plug in" bullets for the busy wait and wait details). Widen the "only docs/** and ARCHITECTURE.md" criterion and the Out-of-scope line to include that file. Limit the ARCHITECTURE.md requirement to modules that carry a rule that file already records: `wait-detail.ts` (browser-safe, imported by the page), `chart-markers.ts` (the one home of marker code), `chart-zoom.ts` (pure, no React). The component files without a rule can be marked "not applicable" in the report. If the owner wants all six in ARCHITECTURE.md, say so in the ticket and adjust the header sentence in scope (this is then an `owner` call).

2. **Acceptance criterion 1 and 5 (stale-phrase search) - the search phrases do not match the stale text at base, so the check passes without the fix - an implementer could satisfy the search and leave the sentence untrue.**
   - `kind legend renders above` is not in the UI doc. The text at line 98 reads "a legend of the step kinds (`step-kind-legend`) above the table (the text view shows the same legend above its editor)". The search is empty before and after, and criterion 5 ("No doc says the legend renders above ...") has no observable check.
   - `Show .* marker labels` and `MarkerLegend` are also absent from the docs at base (the doc says "A marker legend titled "Markers""). Whether the marker-control ticket introduces them is unknown, so they are guesses about wording.
   - Proposed fix: replace the legend check with `git grep -n "step-kind-legend" docs/` listing only the help-dialog section and, in the other paragraphs, no sentence placing the legend on the page. Add the real stale forms to the list: `marker legend` (per-chart legend in the Results paragraph and Chart controls "the plot and the marker legend"), `title row` in the Chart controls paragraph (the "Key results" title row stays, so say which), `` `unitId` `` outside the format doc's description of `unitsProduced`, and `in that order`. Keep the existing phrases as a belt-and-braces check.

## Checks that passed

- Grounded scope: `docs/aoe4-build-order-ui.md`, `-format.md`, `aoe4-build-order.md`, `ARCHITECTURE.md` exist. Stale sentences quoted in Scope exist at base: UI doc line 114 (`<name> (tier <tier>)`), line 98 legend sentence, lines 103-104 (`<cause> <m:ss>` "in that order", `still waiting on <cause>`), line 147-149 (title row, marker legend), format doc line 424 (`was still waiting on resources`), model doc lines 187 and 210. New modules are in design Modules (wait-detail.ts, unit-lines.ts, chart-markers.ts, chart-zoom.ts, use-chart-zoom.ts, page-help.tsx).
- `step-stuck` example: the message is built in `simulate.ts` from `waitingOn` (B-W12 unchanged); `prerequisite` is a real `waitingOn` value. Fine.
- Rule numbers B-T1..6, B-M1..10, B-Z1..15, B-U1..9, B-H1..5, B-H7..9, B-W10, B-B exist in design/M11.md; B-H6 (section text) is correctly excluded, and the B-T4 exemption is sound.
- On merge names items that CONTEXT.md Key surfaces does not yet hold; the field is one `; `-style item list with no trailing prose.
- Invariants A3 listed; docs only, no contradiction. Risk `low` is right (docs only, no critical path). Diagrams not required. Unverified assumptions `none` is right. No open questions; Q128 is consistent with SGS-199 (edits no doc).
- No overlap with other tickets: SGS-191/193/195/197/198/199 each leave their doc edit to this ticket, and SGS-194/195 own the title-row and marker-paragraph edits that this ticket re-reads.
- Dependencies: SGS-194/195/196 are not listed, but they are ancestors of SGS-197/198, so end-state is covered.

## Notes (non-blocking)

- Criterion 6 says each file "exists at the base". On main today none of the six exist; say "at the integrated end state (every Depends-on ticket merged)", as the Context section already does.
- The grep list in Scope (`legend`, `marker`, `unitId`, `zoom`, `title row`) misses `blocked`, `wait`, `queue`; UI doc line 20 (gutter popover) and 102-104 carry wait wording. Add `wait` to the list.
- Criterion 7 (report quotes the doc sentence and the code) and the rule-to-location map are report content, not ticket content; fine as written.
- The `unit-lines.ts` ARCHITECTURE entry has no import rule to state; design says it is used by `simulate.ts` only. "unit line display name" is enough.
