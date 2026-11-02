# SGS-040 ticket report 1

File: projects/strategy-game-sim/tickets/SGS-040-aoe4-paste-grammar-deposits-reactions.md
Title: Add paste grammar for deposits, move all, when/whenever triggers and formatBuildStep, and give ENG 1TC its gold reaction.
Component aoe4-build-order. Risk: high (REPO.md criticalPaths lib/** applies; plan said medium; template rule wins). ~80 business-logic lines. Depends on SGS-039 (transitively 038, 037, 035). On merge: none.

Covers: node token `<id>(#\S*)?` passed through to validation (NODE_TOKEN in node()); `move all`; `when <node> runs out`, `whenever <node> runs out` (reaction), `when <resource> >= N`; formatTrigger/formatAction/formatBuildStep (exported); formatStart ordered by NODE_REFS (local GATHER_NODE_ORDER deleted); ENG 1TC reaction step in english-1tc.json; paste round-trip for every build; bar parts 4 and 5 at 3600 s; docs paste sections; route and Playwright checks.

Diagrams: one small flowchart (paste path); no control loop change.

Criteria checks run on main: GATHER_NODE_ORDER count in parse-text.ts = 2 (0 after); `'a node name', ID` = 1 line; english-1tc.json reaction count = 0; stale doc wording `GatherNodeId` order at docs line 419 = 1. Mutation criteria cannot run until SGS-039 is on the base (the bar test and `depleted` case do not exist on main); the ticket says to run them in a throwaway worktree then.

## Moved from SGS-039 (mechanical re-spec of E)
Bar split chosen: E asserts parts 1-3 at 1200 s and 3600 s for all builds, and parts 4-5 at 1200 s only (ENG 1TC gold does not run out by then and E ships no reaction). F extends parts 4-5 to 3600 s, edits E's test in place.

Remove from SGS-039:
1. Title/Context: "and give ENG 1TC its gold reaction", "gives ENG 1TC the one reaction it needs so it still meets the prebuilt bar"; Milestone/criteria: drop "M3.11 (the shipped build switches deposits through reactions)" (keep M3.7 bar test for the non-reaction half).
2. LOC estimate: drop "`english-1tc.json` 1 step".
3. Scope block `data/aoe4-build-order/builds/english-1tc.json` (the appended `whenever gold` move-all step and its measured basis): whole block moves to F.
4. Scope `builds.test.ts`: parts 4 and 5 asserted at 1200 s only (not 3600 s); parts 1-3 stay at both. Add: "ENG 1TC has no reaction until SGS-040, so gold run-out at 3600 s is F's". The note "round-trip comes back in SGS-040" stays (still true).
5. Scope docs, Prebuilt builds (`:576-578`): keep "state the bar"; drop "ENG 1TC has a gold reaction" and the sentence that "re-parses ... is untrue for ENG 1TC until SGS-040" (after E, ENG 1TC has no reaction so it stays true).
6. Acceptance: delete "ENG 1TC is otherwise unchanged" jq count clause (0 -> 1 reaction) but keep "the earlier steps keep their startedAt" (now: all 24 steps); in "Prebuilt bar" criterion: parts 1-3 at both horizons, 4-5 at 1200 s; remove "For ENG 1TC at 3600 s part 4 is non-vacuous" and both mutations (remove reaction step; remove `depleted` case from triggerHolds fails part 4) -> F. Keep "ENG 1TC to 3600 s reports depletions with sheep and gold run out" (engine fact, no reaction needed).
7. Acceptance `npm run acceptance passes, except as Open question 1` -> plain "passes".
8. Open question 1 (merge-together vs move) deleted; answered by this move.
9. Out of scope gains: "the ENG 1TC gold reaction (SGS-040)".
10. Risk comment/Source: drop english-1tc.json from the high-risk reasoning; Source line add manager decision.

## Open questions
1. designer: E's re-spec must adopt the bar split above (only F's two "bar parts 4 and 5 at 3600 s" lines change otherwise).
2. designer: formatBuildStep drops `reaction` when the trigger is not `depleted` (design silent).
No owner questions. No overlap with other tickets beyond SGS-036 (also edits parse-text.ts: NBSP, sawStep; rebase only) and SGS-050/051 (consume the round-trip and bar).
