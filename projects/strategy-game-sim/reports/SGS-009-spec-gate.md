# SGS-009 spec gate

Verdict: READY

Checked against origin/main (doc text) and sgs-003-validate-fight-inputs @ 018b3f4 (behavior).

- Grounding: doc "Input bounds" is lines 89-106 on main; the sentence to replace (101-102) and the Current code note (104-106) match the ticket text exactly. army.js, fight.ts, combat-simulator-validation.spec.ts exist on the branch.
- Behavior claims verified on branch: army.js MAX_FIGHTERS=10, MAX_LEADERS=5 (options 0-10/0-10/0-5); options disabled when regs+elites > 10 (6 regulars => elites 5-10 disabled, 4 enabled); fight.ts returns 400 {error} on invalid input and 405 with Allow: POST.
- No other doc text mentions "non-numeric", "no bounds", or "0 rounds" (grep), so criterion 2 is satisfiable.
- Invariants: adjacent W1 (doc is the rule source) and S3 (caps); edit makes no rule change, no contradiction. Ticket does not name them explicitly (note only).
- Contracts: no new names. Size: ~6 prose lines. Diagrams: none required. LESSONS.md files are empty.
- Open questions: none.

Risk: agree low. Docs only, no code, no strongModelTriggers hit, criticalPaths empty. The doc is W1's reference but no rule text changes.

Notes (non-blocking):
- Depends on SGS-003 being merged; the implementer must base on origin/main after that merge, else the doc will describe unmerged behavior. The graph dependency already enforces this.
- Line 101 sentence 1 ("The army form offers 0 to 10 ...") stays; only the second sentence is replaced. Criterion 1 is satisfied by editing just that sentence, so the 0-to-5 leaders statement already exists. Keep the new text from duplicating it.
- Shipped doc must not mention SGS-003 or ticket ids.
- Criterion 3 wording ("after the bounds list") would technically permit touching lines 97-99 paragraph; "lines 101-106 only" is tighter.
