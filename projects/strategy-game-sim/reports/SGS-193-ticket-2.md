# SGS-193 ticket 2 (re-spec 1)

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-193-step-annotations-name-the-wait.md
Lint: `ticket-lint.py` exits 0.

## Summary

SGS-193 "Step annotations name the wait" (aoe4-build-order, M11, standard risk, about 50 business-logic lines, depends on SGS-192). It was re-specified from spec-gate-1 and checked against origin/main (`docs/aoe4-build-order-ui.md`, `acceptance/aoe4-step-annotations.spec.ts` imports). Design M11 B-W10, C6 and C17, and the SGS-192 and SGS-200 tickets, were read too.

- Gap 2 (docs): Scope now fixes two untrue statements in the run-cell paragraph of `docs/aoe4-build-order-ui.md`.
  - The causes are listed as `<cause> <m:ss>` "in that order".
  - A `waiting` step adds `still waiting on <cause>`.
  - Both are rewritten to the B-W10 rules here. The rest of that doc stays out of scope and remains with SGS-200.
  - A new criterion checks that the paragraph describes B-W10 and no longer gives the fixed reason order. The scoped `git grep -n "in that order" -- docs/aoe4-build-order-ui.md` matches line 103 at origin/main today, and it must match no wait sentence afterwards.
  - The popover sentence at the top of the doc does not quote the wait text, which I confirmed at the base.
- Gap 3 (busy case): every acceptance case now builds its expected text from the API facts. The spec may import `waitDetailText`, the same way it already imports `formatMinSec`. The busy case:
  - first asserts that step 2 has exactly one `waitDetails` entry with `seconds > 0`, the `building-busy` one;
  - then asserts the cell equals `a free <name>`, with a leading `The ` dropped, followed by `formatMinSec` of the entry's seconds.
- Gap 1 (owner): I did not decide it. It is in Open questions as an `owner:` question with options (a) and (b). Until it is answered:
  - the Castle Age and Barracks cases assert only that the text ends with `still waiting for <what>` and that the cell matches the popover;
  - the `waiting` criterion says which entries come before the tail follows the answer.

Changed criteria are tagged `(respec 1)`, and a `## Re-spec 1 - 2026-11-16` section was appended.

Diagrams: none. It is a single-component change outside the core control loop.

## Open questions

- owner: the B-W10 table and the design's acceptance sentence disagree for a `waiting` step whose own entry is what it still waits for. The knight case reads `Castle Age 20:00, still waiting for Castle Age` by the table, but the design expects `still waiting for Castle Age`.
  - (a) Keep the table. The cases assert the full text built from the API, and the design's acceptance sentence is corrected.
  - (b) Omit from a `waiting` step the entry whose `waitTargetKey` equals the key of its `waitingFor`. The table, the criteria and the design change. The answer must also cover an entry that matches by key but has a different text, for example an `age` entry with no landmark against a `waitingFor` that names a landmark.

## Overlap

- SGS-200 (M11 docs) Scope, the "Wait text" bullet, and its UI-doc wait-text criterion still plan to rewrite the same run-cell sentences. The manager should change that bullet to a check of the sentences SGS-193 rewrote, as SGS-200 already does for the SGS-190, SGS-191 and SGS-192 sentences.
- The rest of SGS-200 is unaffected. Its `still waiting on resources` search target is the format doc's `step-stuck` example, which SGS-200 owns.

No scratch checkout was made.
