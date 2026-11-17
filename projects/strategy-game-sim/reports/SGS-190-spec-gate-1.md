# SGS-190 spec gate 1

**Verdict: NEEDS_SPEC** (two small doc gaps; the engine scope, criteria, tests and risk check out)

## Gaps

1. **Docs / README, stale statement left untouched** (checks 11, 13).
   - Missing: `data/aoe4-build-order/README.md` (Spear/Longbow entry, today's lines 88-103) ends its first paragraph with "Nothing is omitted." After the four Castle blacksmith researches are removed that sentence is untrue. Scope only asks the entry to say the build "no longer researches those four techs".
   - Why an implementer would guess: they may keep the sentence, or reword it in a way the design never fixed.
   - Fix: in Scope's README bullet, require the entry to say the four Castle techs are left out and to drop or correct "Nothing is omitted". Add to the criterion: "the Spear/Longbow entry names the four dropped techs as omitted and does not say nothing is omitted".

2. **Docs / `docs/aoe4-build-order.md`, two reserve statements that become untrue are not listed** (check 11).
   - Missing: Scope enumerates the doc sentences, but two more go false.
     - Priority, line ~176: "While it waits on resources only, it reserves its cost". A produce or research waiting for a busy building also reserves its cost (check 5 and B-B7 check 4).
     - Research paragraph, line ~221: "it reserves resources only when it is short of resources alone". A research waiting for a free instance now reserves as well.
   - Why an implementer would guess: the list is explicit and these two quotes are absent, so they are likely left stale.
   - Fix: add both sentences to the Scope doc list, and add a criterion that no sentence in the doc says a step reserves only while waiting on resources alone.

## Checked and fine

- Grounding: all named files, handlers and all 22 re-baseline test names exist at `origin/main`. `startingWith` and `tierCountAt` are local to `research.test.ts` and are not yet in `test-helpers.ts`, as the ticket says. The four research steps are consecutive in the Spear/Longbow build, after the 950 s blacksmith build step. The BACKLOG item "research occupies its building" exists.
- The re-baseline list is framed as a rule with the 22 as measured examples. The two re-pinned values are by rule (digests and the gold pin), not hand-guessed.
- Sample values (startedAt 20, 15/75, 0/60, 60/120, and so on) are sourced in design/M11.md M11.5a and B-B rules.
- Contracts match C7, C7c, C7d and C7e. No new export from `simulate.ts`, and the `instanceFree` type-import cycle reasoning matches the design.
- Check order and hold semantics match B-B3 to B-B9. `held` is reset before the cursor loop and an empty hold gives `null`. `startProduction` is the only reader of `held` besides `instanceFree`.
- Risk is high, which is correct: it changes `offerSteps` and the order of operations a result depends on, and `offerSteps` is a criticalPaths symbol. A diagram is present. Open questions are none. Invariants A1 to A3 are named. LOC is about 150. Unverified assumptions are none, and there is no external service.
- On merge is a single item and well formed. The doc-search criteria cover wording only, not code.
- No overlap with open tickets. SGS-191 (wait details) extends these handlers after this one.

## Notes

- The Knight/Longbow README line 139 (the Castle blacksmith techs follow `produce knight`) is SGS-189's, as the ticket says.
- The report slot `SGS-190-ticket-1.md` is a ticket-agent report; this is the first spec-gate report.
